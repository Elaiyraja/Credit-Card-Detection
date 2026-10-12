import React from 'react';
import { Wifi, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function CardPreview({
  cardNumber = '',
  cardholderName = 'CARDHOLDER NAME',
  expMonth = 'MM',
  expYear = 'YY',
  brand = 'unknown',
  brandName = 'Card',
  binData = null,
  isLuhnValid = false
}) {
  // Brand color palettes & styling
  const getBrandDesign = () => {
    switch (brand) {
      case 'visa':
        return {
          gradient: 'from-blue-700 via-indigo-800 to-slate-900',
          accent: 'border-blue-400/30',
          logo: (
            <span className="font-black text-xl tracking-wider text-white italic drop-shadow-md">
              VISA
            </span>
          )
        };
      case 'mastercard':
        return {
          gradient: 'from-amber-600 via-rose-700 to-stone-900',
          accent: 'border-amber-400/30',
          logo: (
            <div className="flex items-center -space-x-2">
              <div className="w-5 h-5 rounded-full bg-red-500/90" />
              <div className="w-5 h-5 rounded-full bg-amber-400/90" />
            </div>
          )
        };
      case 'amex':
        return {
          gradient: 'from-teal-700 via-emerald-800 to-cyan-950',
          accent: 'border-teal-400/30',
          logo: (
            <span className="font-extrabold text-sm tracking-widest text-teal-200 border border-teal-300/40 px-1 py-0.5 rounded">
              AMEX
            </span>
          )
        };
      case 'discover':
        return {
          gradient: 'from-orange-600 via-amber-700 to-neutral-900',
          accent: 'border-orange-400/30',
          logo: (
            <span className="font-bold text-sm tracking-widest text-white">
              DISC<span className="text-orange-400">O</span>VER
            </span>
          )
        };
      default:
        return {
          gradient: 'from-slate-800 via-slate-900 to-black',
          accent: 'border-slate-700',
          logo: <span className="font-medium text-xs tracking-wider text-slate-400">SECURE CARD</span>
        };
    }
  };

  const design = getBrandDesign();

  // Format PAN for display
  const cleanPan = cardNumber.replace(/\D/g, '');
  const formattedPan = cleanPan
    ? cleanPan.match(/.{1,4}/g)?.join(' ') || cleanPan
    : '•••• •••• •••• ••••';

  return (
    <div
      className={`relative w-full max-w-sm h-52 rounded-2xl p-5 bg-gradient-to-tr ${design.gradient} text-white shadow-2xl border ${design.accent} overflow-hidden transition-all duration-300 transform hover:scale-[1.01]`}
    >
      {/* Background Hologram Mesh */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

      {/* Top row: Chip, contactless, and brand logo */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          {/* Smart EMV Chip */}
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 p-0.5 shadow-inner flex flex-col justify-between">
            <div className="h-1.5 border-b border-amber-800/40" />
            <div className="h-1.5 border-t border-amber-800/40" />
          </div>
          <Wifi className="w-4 h-4 text-white/70 rotate-90" />
        </div>
        <div className="flex items-center gap-2">
          {binData?.country?.emoji && (
            <span className="text-sm" title={binData.country.name}>
              {binData.country.emoji}
            </span>
          )}
          {design.logo}
        </div>
      </div>

      {/* PAN Display */}
      <div className="mt-7 relative z-10">
        <div className="font-mono text-lg tracking-[0.2em] font-medium drop-shadow-sm truncate">
          {formattedPan}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {cleanPan.length >= 13 && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                isLuhnValid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isLuhnValid ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" /> Luhn Valid
                </>
              ) : (
                <>
                  <ShieldAlert className="w-2.5 h-2.5" /> Checksum Invalid
                </>
              )}
            </span>
          )}

          {binData && binData.bank?.name && (
            <span className="text-[10px] text-slate-300 truncate max-w-[190px]">
              {binData.bank.name}
            </span>
          )}
        </div>
      </div>

      {/* Bottom details: Cardholder and Expiry */}
      <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end z-10">
        <div className="max-w-[65%]">
          <div className="text-[9px] uppercase tracking-wider text-slate-300/80 font-medium">
            Cardholder
          </div>
          <div className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-100 truncate mt-0.5">
            {cardholderName || 'CARDHOLDER NAME'}
          </div>
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-300/80 font-medium text-right">
            Expires
          </div>
          <div className="font-mono text-xs font-semibold text-slate-100 tracking-wider text-right mt-0.5">
            {expMonth || 'MM'}/{expYear ? String(expYear).slice(-2) : 'YY'}
          </div>
        </div>
      </div>
    </div>
  );
}
