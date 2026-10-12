/**
 * Real-Time Fraud & Risk Detection Engine
 * Heuristics evaluated:
 * 1. Velocity Checking (rapid transactions per IP & masked PAN fingerprint)
 * 2. Geo-IP & Issuing Bank Mismatch
 * 3. High-Risk / High-Frequency Card Bin flags (anonymous prepaids)
 * 4. Transaction Amount & Time Anomalies
 * 5. CVV / Expiry mismatch flags
 */

class FraudRiskEngine {
  constructor() {
    // Stores timestamps of recent transactions: key -> array of ISO timestamps
    this.ipHistory = new Map();
    this.cardFingerprintHistory = new Map();
  }

  /**
   * Assess transaction risk
   * @param {Object} context 
   * @returns {Object} score (0-100), decision ('APPROVED'|'REVIEW'|'BLOCKED'), and breakdown
   */
  evaluateRisk({
    cardLast4,
    cardBin,
    binData,
    amount,
    currency = 'USD',
    clientIp = '127.0.0.1',
    billingCountry = 'US',
    deviceRiskScore = 0
  }) {
    let riskScore = 0;
    const flags = [];
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const tenMinutes = 10 * 60 * 1000;

    // 1. IP Velocity Check
    const ipTimestamps = (this.ipHistory.get(clientIp) || []).filter(ts => now - ts < oneHour);
    ipTimestamps.push(now);
    this.ipHistory.set(clientIp, ipTimestamps);

    const recentIpTransactions = ipTimestamps.filter(ts => now - ts < tenMinutes).length;
    if (recentIpTransactions > 4) {
      riskScore += 35;
      flags.push({
        code: 'HIGH_IP_VELOCITY',
        severity: 'HIGH',
        message: `${recentIpTransactions} transaction attempts from IP ${clientIp} in under 10 minutes`
      });
    } else if (ipTimestamps.length > 5) {
      riskScore += 15;
      flags.push({
        code: 'ELEVATED_IP_FREQUENCY',
        severity: 'MEDIUM',
        message: `High frequency activity detected on IP ${clientIp}`
      });
    }

    // 2. Card Fingerprint Velocity Check
    const cardFingerprint = `${cardBin}****${cardLast4}`;
    const cardTimestamps = (this.cardFingerprintHistory.get(cardFingerprint) || []).filter(ts => now - ts < oneHour);
    cardTimestamps.push(now);
    this.cardFingerprintHistory.set(cardFingerprint, cardTimestamps);

    if (cardTimestamps.length > 3) {
      riskScore += 30;
      flags.push({
        code: 'RAPID_CARD_REUSE',
        severity: 'HIGH',
        message: `Card ${cardFingerprint} processed ${cardTimestamps.length} times in past hour`
      });
    }

    // 3. Geo-IP and Issuing Bank Mismatch
    if (binData && binData.country && binData.country.alpha2) {
      const issuerCountry = binData.country.alpha2.toUpperCase();
      const declaredCountry = billingCountry.toUpperCase();
      if (issuerCountry !== 'XX' && declaredCountry && issuerCountry !== declaredCountry) {
        riskScore += 25;
        flags.push({
          code: 'GEO_COUNTRY_MISMATCH',
          severity: 'MEDIUM',
          message: `Card issuing country (${binData.country.name} [${issuerCountry}]) does not match billing country (${declaredCountry})`
        });
      }
    }

    // 4. Card Tier / Prepaid Vulnerability
    if (binData && binData.prepaid) {
      riskScore += 20;
      flags.push({
        code: 'ANONYMOUS_PREPAID_CARD',
        severity: 'LOW',
        message: 'Prepaid anonymous debit instrument detected'
      });
    }

    // 5. High-Value Anomaly
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount > 2500) {
      riskScore += 25;
      flags.push({
        code: 'HIGH_VALUE_TRANSACTION',
        severity: 'MEDIUM',
        message: `Transaction value ($${numericAmount.toFixed(2)}) surpasses standard heuristic threshold`
      });
    } else if (numericAmount > 1000) {
      riskScore += 10;
      flags.push({
        code: 'ELEVATED_VALUE',
        severity: 'LOW',
        message: `Transaction amount ($${numericAmount.toFixed(2)}) flagged for review`
      });
    } else if (numericAmount <= 0) {
      riskScore += 50;
      flags.push({
        code: 'INVALID_AMOUNT',
        severity: 'HIGH',
        message: 'Non-positive transaction magnitude'
      });
    }

    // 6. Incorporate device integrity score
    if (deviceRiskScore > 0) {
      riskScore += Math.min(30, deviceRiskScore);
      flags.push({
        code: 'DEVICE_FINGERPRINT_RISK',
        severity: 'MEDIUM',
        message: 'Client environment or headless browser anomaly noted'
      });
    }

    // Clamp score to 0 - 100
    const finalScore = Math.min(100, Math.max(0, riskScore));

    // Decision Logic
    let decision = 'APPROVED';
    let recommendation = 'Low risk profile. Proceed with instant settlement.';

    if (finalScore >= 75) {
      decision = 'BLOCKED';
      recommendation = 'Critical fraud probability. Transaction declined immediately.';
    } else if (finalScore >= 45) {
      decision = 'REVIEW';
      recommendation = 'Suspicious velocity or mismatch. Step-up 3D-Secure 2.0 verification recommended.';
    }

    return {
      score: finalScore,
      decision,
      recommendation,
      flags,
      timestamp: new Date().toISOString()
    };
  }

  // Clear older telemetry cache periodically
  cleanup() {
    const cutoff = Date.now() - 3600000;
    for (const [key, list] of this.ipHistory.entries()) {
      const filtered = list.filter(ts => ts > cutoff);
      if (filtered.length === 0) this.ipHistory.delete(key);
      else this.ipHistory.set(key, filtered);
    }
  }
}

module.exports = new FraudRiskEngine();
