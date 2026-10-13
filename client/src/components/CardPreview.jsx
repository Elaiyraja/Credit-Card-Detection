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
  const getBrandDesign = () => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return {
          gradient: 'from-blue-700 via-indigo-800 to-slate-900',
          accent: 'border-blue-400/30',
          tierBadge: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
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
          tierBadge: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
          logo: (
            <div className="flex items-center -space-x-2">
              <div className="w-5 h-5 rounded-full bg-red-500/90 shadow" />
              <div className="w-5 h-5 rounded-full bg-amber-400/90 shadow" />
            </div>
          )
        };
      case 'amex':
        return {
          gradient: 'from-teal-700 via-emerald-800 to-cyan-950',
          accent: 'border-teal-400/30',
          tierBadge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
          logo: (
            <span className="font-extrabold text-xs tracking-widest text-teal-200 border border-teal-300/40 px-1.5 py-0.5 rounded shadow">
              AMERICAN EXPRESS
            </span>
          )
        };
      case 'discover':
        return {
          gradient: 'from-orange-600 via-amber-700 to-neutral-900',
          accent: 'border-orange-400/30',
          tierBadge: 'bg-orange-400/20 text-orange-200 border-orange-400/30',
          logo: (
            <span className="font-bold text-sm tracking-widest text-white">
              DISC<span className="text-orange-400 font-extrabold">O</span>VER
            </span>
          )
        };
      case 'rupay':
        return {
          gradient: 'from-orange-700 via-slate-800 to-green-900',
          accent: 'border-orange-400/30',
          tierBadge: 'bg-orange-400/20 text-orange-200 border-orange-400/30',
          logo: (
            <span className="font-black text-base tracking-wider text-white">
              Ru<span className="text-orange-400">Pay</span>
              <span className="text-[10px] text-green-400 ml-0.5">🇮🇳</span>
            </span>
          )
        };
      case 'jcb':
        return {
          gradient: 'from-red-700 via-blue-800 to-emerald-900',
          accent: 'border-red-400/30',
          tierBadge: 'bg-red-400/20 text-red-200 border-red-400/30',
          logo: (
            <div className="flex items-center gap-0.5 font-black text-xs px-1.5 py-0.5 rounded bg-white text-blue-900">
              <span className="text-blue-700">J</span>
              <span className="text-red-600">C</span>
              <span className="text-green-600">B</span>
            </div>
          )
        };
      case 'diners':
        return {
          gradient: 'from-sky-800 via-slate-800 to-blue-950',
          accent: 'border-sky-400/30',
          tierBadge: 'bg-sky-400/20 text-sky-200 border-sky-400/30',
          logo: (
            <span className="font-bold text-xs tracking-wider text-sky-200 border border-sky-400/30 px-1 py-0.5 rounded">
              DINERS CLUB
            </span>
          )
        };
      case 'unionpay':
        return {
          gradient: 'from-red-800 via-rose-900 to-slate-900',
          accent: 'border-red-400/30',
          tierBadge: 'bg-red-400/20 text-red-200 border-red-400/30',
          logo: (
            <div className="flex items-center text-xs font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-red-600 to-blue-700 text-white">
              UnionPay
            </div>
          )
        };
      case 'maestro':
        return {
          gradient: 'from-blue-800 via-red-900 to-slate-900',
          accent: 'border-blue-400/30',
          tierBadge: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
          logo: (
            <div className="flex items-center -space-x-2">
              <div className="w-5 h-5 rounded-full bg-blue-600/90 shadow" />
              <div className="w-5 h-5 rounded-full bg-red-600/90 shadow" />
            </div>
          )
        };
      case 'mir':
        return {
          gradient: 'from-emerald-700 via-teal-900 to-slate-950',
          accent: 'border-emerald-400/30',
          tierBadge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
          logo: (
            <span className="font-black text-sm tracking-widest text-emerald-300">
              МИР
            </span>
          )
        };
      case 'elo':
        return {
          gradient: 'from-red-700 via-amber-700 to-sky-900',
          accent: 'border-amber-400/30',
          tierBadge: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
          logo: (
            <span className="font-black text-base tracking-wider text-amber-300">
              elo
            </span>
          )
        };
      default:
        return {
          gradient: 'from-slate-800 via-slate-900 to-black',
          accent: 'border-slate-700',
          tierBadge: 'bg-slate-800 text-slate-300 border-slate-700',
          logo: <span className="font-semibold text-xs tracking-wider text-slate-300">GLOBAL NETWORK</span>
        };
    }
  };

  const design = getBrandDesign();
  const cleanPan = cardNumber.replace(/\D/g, '');
  const formattedPan = cleanPan
    ? (brand.toLowerCase() === 'amex'
        ? cleanPan.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join(' '))
        : cleanPan.match(/.{1,4}/g)?.join(' ') || cleanPan)
    : '•••• •••• •••• ••••';

  return (
    <div
      className={`relative w-full max-w-sm h-52 rounded-2xl p-5 bg-gradient-to-tr ${design.gradient} text-white shadow-2xl border ${design.accent} overflow-hidden transition-all duration-300 transform hover:scale-[1.01]`}
    >
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

      {/* Top row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 p-0.5 shadow-inner flex flex-col justify-between">
            <div className="h-1.5 border-b border-amber-800/40" />
            <div className="h-1.5 border-t border-amber-800/40" />
          </div>
          <Wifi className="w-4 h-4 text-white/70 rotate-90" />
        </div>
        <div className="flex items-center gap-2">
          {binData?.country && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-mono">
              {binData.country}
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
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
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

          {binData?.bank && (
            <span className="text-[10px] text-slate-300 truncate max-w-[190px] font-medium">
              {binData.bank}
            </span>
          )}
        </div>
      </div>

      {/* Bottom details */}
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
