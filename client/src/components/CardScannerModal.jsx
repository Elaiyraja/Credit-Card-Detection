import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, Scan, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function CardScannerModal({ isOpen, onClose, onCardDetected }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'upload' or 'presets'
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Preset Realistic Test Cards for instant dev exploration
  const TEST_PRESETS = [
    {
      label: 'Visa Gold (Chase Bank - US)',
      number: '4532 0155 8899 4123',
      exp: '11/28',
      cvc: '382',
      name: 'ALEXANDER HAMILTON',
      country: 'US',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Mastercard Platinum (Barclays - UK)',
      number: '5105 1076 2201 9845',
      exp: '09/27',
      cvc: '741',
      name: 'ELENA VANCE',
      country: 'GB',
      riskExpected: 'Geo-Risk Check'
    },
    {
      label: 'Amex Centurion (US Premium)',
      number: '3714 4963 5398 431',
      exp: '04/29',
      cvc: '8910',
      name: 'VICTORIA STERLING',
      country: 'US',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Discover It (US)',
      number: '6011 0089 3341 5521',
      exp: '08/28',
      cvc: '512',
      name: 'MARCUS HOLLOWAY',
      country: 'US',
      riskExpected: 'Low Risk'
    },
    {
      label: 'Declined Sandbox Card (Stripe Spec)',
      number: '4000 0002 0002 0002',
      exp: '12/28',
      cvc: '123',
      name: 'TEST DECLINE USER',
      country: 'US',
      riskExpected: 'Declined Trigger'
    }
  ];

  const handleSimulateScan = (cardData) => {
    setScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          onCardDetected(cardData);
          onClose();
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
      // Run OCR scan simulation on the uploaded card image
      handleSimulateScan({
        number: '4532 0188 9922 4112',
        expMonth: '11',
        expYear: '28',
        cardholderName: 'SARAH CONNOR'
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl glass-card rounded-2xl p-6 border border-cyan-500/30 glow-blue text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100">Live Card Scanner & OCR Ingestion</h3>
              <p className="text-xs text-slate-400">Edge Optical Card Reader & Test Presets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700 text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-700/60 mt-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'camera'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Camera Scanner
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> File / Image OCR
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'presets'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Test Card Vault
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5">
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-56 rounded-xl bg-slate-900 border-2 border-dashed border-cyan-500/40 flex flex-col items-center justify-center overflow-hidden">
                {/* Visual Camera HUD Reticle */}
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
                    <p className="text-sm font-medium text-slate-200">Position Credit Card in Frame</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Webcam / Video stream will detect emboss digits, PAN, and expiry metadata.
                    </p>
                  </div>
                )}

                {/* Laser scan animation line */}
                {scanning && (
                  <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse top-1/2" />
                )}
              </div>

              <div className="flex gap-3 mt-4 w-full">
                <button
                  type="button"
                  disabled={scanning}
                  onClick={() =>
                    handleSimulateScan({
                      number: '4532 0155 8899 4123',
                      expMonth: '11',
                      expYear: '28',
                      cardholderName: 'ALEXANDER HAMILTON'
                    })
                  }
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-medium text-sm text-white shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Scan className="w-4 h-4" /> Trigger Video Frame OCR
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
                      Drop front-side card image here or browse
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, or WebP up to 5MB</p>
                  </>
                )}
              </div>

              {scanning && (
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-400 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Performing client-side character
                  segmentation...
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {TEST_PRESETS.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const [m, y] = card.exp.split('/');
                    onCardDetected({
                      number: card.number,
                      expMonth: m,
                      expYear: y,
                      cvc: card.cvc,
                      cardholderName: card.name
                    });
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                        {card.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {card.riskExpected}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-1">
                      {card.number} • Exp: {card.exp} • CVV: {card.cvc}
                    </div>
                  </div>
                  <button className="text-xs px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black font-medium transition">
                    Fill
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Client-side image sanitization
          </span>
          <span className="text-slate-400">Zero image persistence</span>
        </div>
      </div>
    </div>
  );
}
