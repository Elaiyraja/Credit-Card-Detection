import React, { useState, useEffect } from 'react';
import { 
  Shield, CreditCard, AlertTriangle, CheckCircle, RefreshCw, 
  Scan, Zap, Lock, Activity, Eye, EyeOff
} from 'lucide-react';
import CardPreview from './components/CardPreview';
import CardScannerModal from './components/CardScannerModal';
import RiskScoreCard from './components/RiskScoreCard';
import LiveMonitoringDashboard from './components/LiveMonitoringDashboard';
import { saveTransactionCloud, subscribeRecentTransactions } from './firebase';

function validateLuhn(cardNumber) {
  const sanitized = String(cardNumber).replace(/\D/g, '');
  if (!sanitized || sanitized.length < 13 || sanitized.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function detectCardBrand(cardNumber) {
  const clean = String(cardNumber).replace(/\D/g, '');
  if (/^4[0-9]{0,18}$/.test(clean)) return { brand: 'visa', name: 'Visa', length: [16, 19], cvvLength: 3 };
  if (/^(5[1-5]|2[2-7])/.test(clean)) return { brand: 'mastercard', name: 'Mastercard', length: [16], cvvLength: 3 };
  if (/^3[47]/.test(clean)) return { brand: 'amex', name: 'American Express', length: [15], cvvLength: 4 };
  if (/^(6011|65|64[4-9]|622[1-9])/.test(clean)) return { brand: 'discover', name: 'Discover', length: [16], cvvLength: 3 };
  if (/^(?:2131|1800|35[0-9]{2})/.test(clean)) return { brand: 'jcb', name: 'JCB', length: [16], cvvLength: 3 };
  return { brand: 'unknown', name: 'Unknown Card', length: [16], cvvLength: 3 };
}

function calculateRisk({ cardNumber, amount, ipCountry, binData }) {
  const clean = String(cardNumber).replace(/\D/g, '');
  const luhnValid = validateLuhn(clean);
  let score = 5;
  const flags = [];

  if (!luhnValid && clean.length >= 13) {
    score += 60;
    flags.push({ rule: 'LUHN_CHECKSUM_FAILURE', severity: 'CRITICAL', description: 'Failed Mod-10 checksum validation' });
  }

  const amt = parseFloat(amount) || 0;
  if (amt > 5000) {
    score += 35;
    flags.push({ rule: 'HIGH_VALUE_THRESHOLD', severity: 'HIGH', description: 'Transaction exceeds $5,000 threshold' });
  } else if (amt > 1500) {
    score += 15;
    flags.push({ rule: 'ELEVATED_VALUE', severity: 'MEDIUM', description: 'Transaction amount is elevated ($1500+)' });
  }

  const highRiskGeo = ['RU', 'NG', 'KP', 'IR', 'BY'];
  if (ipCountry && highRiskGeo.includes(ipCountry.toUpperCase())) {
    score += 30;
    flags.push({ rule: 'HIGH_RISK_GEO', severity: 'HIGH', description: 'Billing originating from high-risk jurisdiction' });
  }

  if (binData && ipCountry && binData.country && binData.country !== ipCountry) {
    score += 20;
    flags.push({ rule: 'GEO_BIN_MISMATCH', severity: 'MEDIUM', description: 'Card issuing country differs from IP country' });
  }

  score = Math.min(score, 100);
  let decision = 'APPROVED';
  let recommendation = 'Standard low-risk profile. Safe to process.';

  if (score >= 70) {
    decision = 'BLOCKED';
    recommendation = 'High risk indicator triggered. Automated rejection recommended.';
  } else if (score >= 40) {
    decision = 'REVIEW';
    recommendation = 'Requires step-up authentication or manual merchant review.';
  }

  return { score, decision, recommendation, flags };
}

export default function App() {
  const [cardNumber, setCardNumber] = useState('4532 0155 8899 4123');
  const [cardholderName, setCardholderName] = useState('ALEXANDER HAMILTON');
  const [expMonth, setExpMonth] = useState('11');
  const [expYear, setExpYear] = useState('28');
  const [cvc, setCvc] = useState('382');
  const [amount, setAmount] = useState('249.99');
  const [ipCountry, setIpCountry] = useState('US');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [metrics, setMetrics] = useState({
    totalProcessed: 14,
    approvedCount: 11,
    flaggedCount: 2,
    blockedCount: 1,
    averageLatencyMs: 185,
    totalVolume: 4892.50
  });

  const [recentTransactions, setRecentTransactions] = useState([
    { id: 'tx_01', cardBrand: 'visa', maskedPan: '4532********4123', amount: 149.00, decision: 'APPROVED', riskScore: 12, createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: 'tx_02', cardBrand: 'mastercard', maskedPan: '5424********9911', amount: 890.50, decision: 'APPROVED', riskScore: 24, createdAt: new Date(Date.now() - 360000).toISOString() },
    { id: 'tx_03', cardBrand: 'amex', maskedPan: '3782********8492', amount: 6420.00, decision: 'BLOCKED', riskScore: 88, createdAt: new Date(Date.now() - 600000).toISOString() }
  ]);

  useEffect(() => {
    try {
      const unsub = subscribeRecentTransactions((cloudTxs) => {
        if (cloudTxs && cloudTxs.length > 0) {
          setRecentTransactions(cloudTxs);
        }
      });
      return () => unsub && unsub();
    } catch (e) {
      console.log('Firebase fallback mode');
    }
  }, []);

  const cleanCard = cardNumber.replace(/\D/g, '');
  const brandInfo = detectCardBrand(cleanCard);
  const isLuhnValid = validateLuhn(cleanCard);
  const isComplete = cleanCard.length >= 13;

  const binData = cleanCard.length >= 6 ? {
    scheme: brandInfo.brand.toUpperCase(),
    bank: cleanCard.startsWith('4') ? 'JPMorgan Chase' : cleanCard.startsWith('5') ? 'Citigroup' : 'American Express',
    country: 'US',
    countryName: 'United States',
    cardType: 'CREDIT',
    tier: 'PLATINUM'
  } : null;

  const currentAssessment = isComplete ? calculateRisk({
    cardNumber: cleanCard,
    amount,
    ipCountry,
    binData
  }) : null;

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
    let formatted = raw;
    if (brandInfo.brand === 'amex') {
      formatted = raw.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join(' '));
    } else {
      formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    }
    setCardNumber(formatted);
  };

  const handleCardDetected = (card) => {
    setCardNumber(card.number || '');
    if (card.name) setCardholderName(card.name);
    if (card.exp) {
      const parts = card.exp.split('/');
      if (parts[0]) setExpMonth(parts[0]);
      if (parts[1]) setExpYear(parts[1]);
    }
    if (card.cvc) setCvc(card.cvc);
    if (card.country) setIpCountry(card.country);
  };

  const handleProcessTransaction = async (e) => {
    e.preventDefault();
    if (!cleanCard) return;

    setIsProcessing(true);
    const assessment = calculateRisk({
      cardNumber: cleanCard,
      amount,
      ipCountry,
      binData
    });

    const txPayload = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      cardBrand: brandInfo.brand,
      maskedPan: cleanCard.slice(0, 4) + '********' + cleanCard.slice(-4),
      amount: parseFloat(amount),
      decision: assessment.decision,
      riskScore: assessment.score,
      createdAt: new Date().toISOString()
    };

    try {
      await saveTransactionCloud(txPayload);
    } catch (err) {}

    setTimeout(() => {
      setRecentTransactions(prev => [txPayload, ...prev.slice(0, 9)]);
      setMetrics(prev => ({
        totalProcessed: prev.totalProcessed + 1,
        approvedCount: assessment.decision === 'APPROVED' ? prev.approvedCount + 1 : prev.approvedCount,
        flaggedCount: assessment.decision === 'REVIEW' ? prev.flaggedCount + 1 : prev.flaggedCount,
        blockedCount: assessment.decision === 'BLOCKED' ? prev.blockedCount + 1 : prev.blockedCount,
        averageLatencyMs: Math.floor(160 + Math.random() * 80),
        totalVolume: assessment.decision === 'APPROVED' ? prev.totalVolume + parseFloat(amount) : prev.totalVolume
      }));

      setLastResult({
        success: assessment.decision === 'APPROVED',
        decision: assessment.decision,
        score: assessment.score,
        txId: txPayload.id
      });
      setIsProcessing(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                CreditGuard AI
              </span>
              <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                REAL-TIME DETECTION
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-semibold">CLOUD ENGINE READY</span>
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>SCAN / TEST CARDS</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {lastResult && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between ${
            lastResult.decision === 'APPROVED' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : lastResult.decision === 'REVIEW'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center space-x-3">
              {lastResult.decision === 'APPROVED' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider text-sm">
                  Transaction Result: {lastResult.decision}
                </span>
                <span className="ml-3 text-xs opacity-80 font-mono">
                  ID: {lastResult.txId} | Risk Score: {lastResult.score}/100
                </span>
              </div>
            </div>
            <button 
              onClick={() => setLastResult(null)}
              className="text-xs underline cursor-pointer opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="relative flex justify-center">
              <div className="w-full max-w-md">
                <CardPreview
                  cardNumber={cardNumber}
                  cardholderName={cardholderName}
                  expMonth={expMonth}
                  expYear={expYear}
                  brand={brandInfo.brand}
                  brandName={brandInfo.name}
                  binData={binData}
                  isLuhnValid={isLuhnValid}
                />
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                    <span>Real-Time Detection & Validation</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Live Luhn algorithm checksum, brand recognition, and PCI-DSS masked telemetry.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Card Scanner</span>
                </button>
              </div>

              <form onSubmit={handleProcessTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Card Number (PAN)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4532 0155 8899 4123"
                      maxLength={23}
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm tracking-widest"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      {cleanCard.length > 0 && (
                        isLuhnValid ? (
                          <span className="flex items-center text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Luhn Valid
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-mono">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Invalid Checksum
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                    placeholder="ALEXANDER HAMILTON"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 text-sm tracking-wider uppercase"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Exp Month
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ''))}
                      placeholder="11"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white font-mono placeholder:text-slate-600 text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Exp Year
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ''))}
                      placeholder="28"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white font-mono placeholder:text-slate-600 text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      maxLength={brandInfo.cvvLength}
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                      placeholder="•••"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white font-mono placeholder:text-slate-600 text-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 tracking-widest"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Simulated Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Simulated IP Country
                    </label>
                    <select
                      value={ipCountry}
                      onChange={(e) => setIpCountry(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer"
                    >
                      <option value="US">United States (US)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="DE">Germany (DE)</option>
                      <option value="RU">Russia (RU - High Risk)</option>
                      <option value="NG">Nigeria (NG - High Risk)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isProcessing || !cleanCard}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ANALYZING & DETECTING FRAUD...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>RUN RISK ASSESSMENT & PROCESS</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Real-Time Risk Analysis Engine
                </h3>
                {currentAssessment && (
                  <span className="text-xs font-mono text-cyan-400">
                    Active Telemetry
                  </span>
                )}
              </div>
              <RiskScoreCard 
                assessment={currentAssessment} 
                binData={binData} 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Live Transaction Telemetry
                </h3>
                <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Real-Time Stream</span>
                </span>
              </div>
              <LiveMonitoringDashboard
                metrics={metrics}
                recentTransactions={recentTransactions}
              />
            </div>
          </div>
        </div>
      </main>

      <CardScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCardDetected={handleCardDetected}
      />
    </div>
  );
}
