const express = require('express');
const router = express.Router();
const cardValidator = require('../utils/cardValidator');
const binService = require('../services/binService');
const fraudEngine = require('../services/fraudEngine');
const paymentGateway = require('../services/paymentGateway');

// In-memory telemetry log for real-time monitoring and reporting
const transactionsLog = [];
let telemetryMetrics = {
  totalProcessed: 0,
  approvedCount: 0,
  flaggedCount: 0,
  blockedCount: 0,
  averageLatencyMs: 240,
  totalVolume: 0
};

// Expose accessor for telemetry
router.getTelemetry = () => ({
  metrics: telemetryMetrics,
  recentTransactions: transactionsLog.slice(-50).reverse()
});

/**
 * 1. Live Card Validation & Brand Detection
 * Validates Luhn, Brand, and BIN metadata as user types
 */
router.post('/validate-card', async (req, res) => {
  const { cardNumber, expMonth, expYear, cvc } = req.body;

  if (!cardNumber) {
    return res.status(400).json({ error: 'Card number is required' });
  }

  const cleanNumber = String(cardNumber).replace(/\D/g, '');
  const brandInfo = cardValidator.detectCardBrand(cleanNumber);
  const isLuhnValid = cardValidator.validateLuhn(cleanNumber);
  const maskedPan = cardValidator.maskCardNumber(cleanNumber);

  let expiryStatus = { valid: true };
  if (expMonth && expYear) {
    expiryStatus = cardValidator.validateExpiry(expMonth, expYear);
  }

  let binData = null;
  if (cleanNumber.length >= 6) {
    try {
      binData = await binService.lookup(cleanNumber.slice(0, 6));
    } catch (err) {
      console.warn('BIN lookup non-fatal error:', err.message);
    }
  }

  return res.json({
    brand: brandInfo.brand,
    brandName: brandInfo.name,
    cvvLength: brandInfo.cvvLength,
    isLuhnValid,
    isCompleteLength: brandInfo.length.includes(cleanNumber.length),
    expiryValid: expiryStatus.valid,
    expiryError: expiryStatus.error || null,
    maskedDisplay: cardValidator.formatDisplayMasked(cleanNumber),
    maskedPan,
    binData
  });
});

/**
 * 2. Instant BIN / Financial Institution Lookup
 */
router.get('/bin-lookup/:bin', async (req, res) => {
  try {
    const binData = await binService.lookup(req.params.bin);
    if (!binData) {
      return res.status(404).json({ error: 'BIN not found' });
    }
    return res.json({ success: true, data: binData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Pre-Flight Real-Time Fraud & Risk Assessment
 */
router.post('/risk-assessment', async (req, res) => {
  const {
    cardNumber,
    amount,
    currency,
    billingCountry,
    deviceRiskScore
  } = req.body;

  const cleanNumber = String(cardNumber || '').replace(/\D/g, '');
  const cardBin = cleanNumber.slice(0, 6);
  const cardLast4 = cleanNumber.slice(-4);

  const binData = cardBin.length >= 6 ? await binService.lookup(cardBin) : null;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  const riskAssessment = fraudEngine.evaluateRisk({
    cardLast4,
    cardBin,
    binData,
    amount,
    currency,
    clientIp,
    billingCountry,
    deviceRiskScore
  });

  return res.json({
    success: true,
    assessment: riskAssessment,
    binData
  });
});

/**
 * 4. Secure Payment Processing (Tokenization Vault + Fraud Engine + Gateway)
 * PCI-DSS Standard: Takes card info, converts to token, evaluates risk, captures charge.
 */
router.post('/process-payment', async (req, res) => {
  const startTime = Date.now();
  const io = req.app.get('io');

  try {
    const {
      cardNumber,
      expMonth,
      expYear,
      cvc,
      cardholderName,
      amount,
      currency = 'USD',
      billingCountry = 'US',
      sandboxMode = true,
      forceDecline = false
    } = req.body;

    const cleanNumber = String(cardNumber || '').replace(/\D/g, '');
    const cardLast4 = cleanNumber.slice(-4);
    const cardBin = cleanNumber.slice(0, 6);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // 1. Basic format and Luhn validation check
    const isLuhnValid = cardValidator.validateLuhn(cleanNumber);
    if (!isLuhnValid) {
      return res.status(422).json({
        success: false,
        error: 'Invalid card number checksum (Luhn algorithm failure)',
        code: 'LUHN_VALIDATION_FAILED'
      });
    }

    const expiryCheck = cardValidator.validateExpiry(expMonth, expYear);
    if (!expiryCheck.valid) {
      return res.status(422).json({
        success: false,
        error: expiryCheck.error,
        code: 'EXPIRY_INVALID'
      });
    }

    // 2. Fetch BIN Intelligence
    const binData = await binService.lookup(cardBin);

    // 3. Evaluate Real-Time Risk Score
    const riskAssessment = fraudEngine.evaluateRisk({
      cardLast4,
      cardBin,
      binData,
      amount,
      currency,
      clientIp,
      billingCountry
    });

    // If Fraud Engine blocks transaction
    if (riskAssessment.decision === 'BLOCKED') {
      const record = {
        id: `tx_block_${Date.now()}`,
        status: 'BLOCKED',
        amount: parseFloat(amount).toFixed(2),
        currency,
        cardLast4,
        cardBrand: binData?.scheme || 'card',
        issuer: binData?.bank?.name || 'Unknown Issuer',
        riskScore: riskAssessment.score,
        riskDecision: 'BLOCKED',
        flags: riskAssessment.flags,
        ip: clientIp,
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startTime
      };

      transactionsLog.push(record);
      telemetryMetrics.totalProcessed += 1;
      telemetryMetrics.blockedCount += 1;

      // Broadcast live alert to all connected dashboard websockets
      if (io) {
        io.emit('transaction:alert', {
          type: 'TRANSACTION_BLOCKED',
          record,
          metrics: telemetryMetrics
        });
      }

      return res.status(403).json({
        success: false,
        status: 'BLOCKED',
        error: 'Transaction halted by Anti-Fraud Engine due to elevated risk profile',
        riskAssessment,
        record
      });
    }

    // 4. Secure Tokenization Vault
    const tokenResult = await paymentGateway.tokenizeCard({
      number: cleanNumber,
      exp_month: expMonth,
      exp_year: expYear,
      cvc,
      name: cardholderName
    });

    // 5. Payment Gateway Authorization & Capture
    const gatewayResult = await paymentGateway.processPayment({
      tokenId: tokenResult.tokenId,
      amount,
      currency,
      description: `Purchase by ${cardholderName || 'Customer'}`,
      metadata: {
        last4: cardLast4,
        forceDecline: Boolean(forceDecline),
        riskScore: riskAssessment.score
      }
    });

    const totalLatency = Date.now() - startTime;

    // Update Telemetry Metrics
    telemetryMetrics.totalProcessed += 1;
    if (gatewayResult.success) {
      telemetryMetrics.approvedCount += 1;
      telemetryMetrics.totalVolume += parseFloat(amount);
    } else {
      telemetryMetrics.flaggedCount += 1;
    }
    telemetryMetrics.averageLatencyMs = Math.round(
      (telemetryMetrics.averageLatencyMs * 0.8) + (totalLatency * 0.2)
    );

    const transactionRecord = {
      id: gatewayResult.transactionId || `tx_${Date.now()}`,
      status: gatewayResult.success ? 'APPROVED' : 'DECLINED',
      authCode: gatewayResult.authCode || null,
      amount: parseFloat(amount).toFixed(2),
      currency,
      cardLast4,
      cardBrand: binData?.scheme || tokenResult.card.brand || 'card',
      issuer: binData?.bank?.name || 'Cardholder Issuer',
      issuingCountry: binData?.country?.name || 'Global',
      flagEmoji: binData?.country?.emoji || '🌐',
      riskScore: riskAssessment.score,
      riskDecision: riskAssessment.decision,
      flags: riskAssessment.flags,
      gateway: gatewayResult.gateway,
      latencyMs: totalLatency,
      timestamp: new Date().toISOString(),
      errorCode: gatewayResult.errorCode || null,
      errorMessage: gatewayResult.errorMessage || null
    };

    transactionsLog.push(transactionRecord);

    // Broadcast Real-Time Event via WebSockets
    if (io) {
      io.emit('transaction:new', {
        transaction: transactionRecord,
        metrics: telemetryMetrics
      });
    }

    return res.json({
      success: gatewayResult.success,
      transaction: transactionRecord,
      riskAssessment,
      gateway: gatewayResult
    });
  } catch (err) {
    console.error('Payment processing failed:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * 5. Dashboard Telemetry & Stats API
 */
router.get('/metrics', (req, res) => {
  return res.json({
    metrics: telemetryMetrics,
    recentTransactions: transactionsLog.slice(-50).reverse()
  });
});

module.exports = router;
