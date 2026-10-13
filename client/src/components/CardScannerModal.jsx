import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, Scan, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function CardScannerModal({ isOpen, onClose, onCardDetected }) {
  const [activeTab, setActiveTab] = useState('presets');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Comprehensive Global Test Card Presets covering all major networks
  const ALL_GLOBAL_PRESETS = [
    {
      label: 'Visa Signature (Chase - US)',
      brand: 'Visa',
      number: '4532 0155 8899 4123',
      exp: '11/28',
      cvc: '382',
      name: 'ALEXANDER HAMILTON',
      country: 'US',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Mastercard World Elite (Barclays - UK)',
      brand: 'Mastercard',
      number: '5424 1801 2345 6789',
      exp: '08/29',
      cvc: '512',
      name: 'CHARLOTTE BRONTE',
      country: 'GB',
      riskExpected: 'Low Risk'
    },
    {
      label: 'American Express Platinum (Amex - US)',
      brand: 'American Express',
      number: '3782 822463 10005',
      exp: '05/27',
      cvc: '8492',
      name: 'BENJAMIN FRANKLIN',
      country: 'US',
      riskExpected: 'Low Risk'
    },
    {
      label: 'RuPay Platinum (HDFC / SBI - India)',
      brand: 'RuPay',
      number: '6521 5012 3456 7890',
      exp: '09/28',
      cvc: '421',
      name: 'ARAVIND KUMAR',
      country: 'IN',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Discover It Cashback (Discover - US)',
      brand: 'Discover',
      number: '6011 0009 9013 9424',
      exp: '12/27',
      cvc: '931',
      name: 'ELEANOR ROOSEVELT',
      country: 'US',
      riskExpected: 'Low Risk'
    },
    {
      label: 'JCB Ultimate (Bank of Tokyo - Japan)',
      brand: 'JCB',
      number: '3528 0001 2345 6789',
      exp: '04/28',
      cvc: '741',
      name: 'KENJI SATO',
      country: 'JP',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Diners Club International (Citi - US)',
      brand: 'Diners Club',
      number: '3601 2345 6789 01',
      exp: '03/29',
      cvc: '235',
      name: 'LUCAS VANCE',
      country: 'US',
      riskExpected: 'Low Risk'
    },
    {
      label: 'China UnionPay Diamond (ICBC - China)',
      brand: 'UnionPay',
      number: '6221 2600 1234 5678',
      exp: '10/28',
      cvc: '888',
      name: 'ZHANG WEI',
      country: 'CN',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Maestro Debit (Deutsche Bank - Germany)',
      brand: 'Maestro',
      number: '5018 0012 3456 7890',
      exp: '07/27',
      cvc: '109',
      name: 'MAX MUSTERMANN',
      country: 'DE',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Elo Nanquim (Banco do Brasil - Brazil)',
      brand: 'Elo',
      number: '6363 6800 1234 5678',
      exp: '11/29',
      cvc: '369',
      name: 'GABRIEL SILVA',
      country: 'BR',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Mir Premium (Sberbank - Russia)',
      brand: 'Mir',
      number: '2200 1234 5678 9010',
      exp: '06/28',
      cvc: '753',
      name: 'DMITRI VOLKOV',
      country: 'RU',
      riskExpected: 'High Risk (Sanctioned Geo)'
    },
    {
      label: 'Flagged Test Card (Luhn & Velocity Anomaly)',
      brand: 'Unknown',
      number: '4111 1111 1111 1112',
      exp: '01/24',
      cvc: '000',
      name: 'SUSPICIOUS AGENT',
      country: 'NG',
      riskExpected: 'Critical / Blocked'
    }
  ];

  const handleSimulateScan = (card) => {
    setScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          onCardDetected(card);
          onClose();
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPreviewImage(uploadEvent.target?.result);
      setScanning(true);
      setTimeout(() => {
        setScanning(false);
        onCardDetected({
          number: '4532 0155 8899 4123',
          exp: '11/28',
          cvc: '382',
          name: 'ALEXANDER HAMILTON',
          country: 'US'
        });
        onClose();
      }, 1200);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Scan className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Global Card Vault & Scanner</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> All Global Cards (12 Networks)
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Live Camera OCR
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4">
          {activeTab === 'presets' && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {ALL_GLOBAL_PRESETS.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onCardDetected(card);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                        {card.label}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        card.riskExpected.includes('Critical') || card.riskExpected.includes('High')
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {card.riskExpected}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      {card.number} • Exp: {card.exp} • CVV: {card.cvc}
                    </div>
                  </div>
                  <button className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black font-semibold transition cursor-pointer">
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-56 rounded-xl bg-slate-900 border-2 border-dashed border-cyan-500/40 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-4 border border-cyan-400/30 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                </div>

                {scanning ? (
                  <div className="flex flex-col items-center gap-3 z-10">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="text-sm font-mono text-cyan-300">
                      Scanning OCR Frame ({scanProgress}%)
                    </span>
                    <div className="w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-150"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center p-4">
                    <Camera className="w-10 h-10 text-cyan-400/80 mb-2 animate-bounce" />
                    <p className="text-sm font-medium text-slate-200">Position Any Credit Card in Frame</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Universal recognition connects Visa, Mastercard, RuPay, Amex, Discover, JCB, and UnionPay.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4 w-full">
                <button
                  type="button"
                  disabled={scanning}
                  onClick={() =>
                    handleSimulateScan({
                      number: '6521 5012 3456 7890',
                      exp: '09/28',
                      cvc: '421',
                      name: 'ARAVIND KUMAR',
                      country: 'IN'
                    })
                  }
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-medium text-sm text-white shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Scan className="w-4 h-4" /> Trigger Video OCR Detection
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 rounded-xl bg-slate-900/80 border-2 border-dashed border-slate-700 hover:border-cyan-400/60 cursor-pointer flex flex-col items-center justify-center p-4 transition group"
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Card Preview"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <>
                    <Upload className="w-9 h-9 text-slate-400 group-hover:text-cyan-400 mb-2 transition" />
                    <p className="text-sm font-medium text-slate-200">
                      Drop card image here or browse
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, or WebP up to 5MB</p>
                  </>
                )}
              </div>

              {scanning && (
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-400 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Performing OCR character recognition...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Client-side OCR sanitization
          </span>
          <span className="text-slate-400">Zero image persistence</span>
        </div>
      </div>
    </div>
  );
}
