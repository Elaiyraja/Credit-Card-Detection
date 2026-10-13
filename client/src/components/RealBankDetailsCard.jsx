import React from 'react';
import { Building2, Globe2, Phone, ExternalLink, ShieldCheck, CreditCard, Tag } from 'lucide-react';

export default function RealBankDetailsCard({ bankData }) {
  if (!bankData) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-slate-500 text-xs text-center flex flex-col items-center justify-center min-h-[140px]">
        <Building2 className="w-6 h-6 text-slate-700 mb-2" />
        <span>Enter first 6 digits to view verified bank & issuer registry</span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
            {bankData.source || 'VERIFIED REGISTRY'}
          </span>
          <h4 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{bankData.bank}</span>
          </h4>
        </div>
        <div className="text-2xl" title={bankData.countryName}>
          {bankData.flag || '🌐'}
        </div>
      </div>

      {/* Grid of Bank & Card Attributes */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Card Tier / Level</span>
          <span className="font-semibold text-slate-100 font-mono text-xs text-cyan-300">
            {bankData.tier || 'STANDARD'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Card Product Type</span>
          <span className="font-semibold text-slate-100 font-mono text-xs text-emerald-300">
            {bankData.type || 'CREDIT'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Issuing Jurisdiction</span>
          <span className="font-semibold text-slate-100 font-mono text-xs">
            {bankData.countryName} ({bankData.country})
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Settlement Currency</span>
          <span className="font-semibold text-slate-100 font-mono text-xs text-amber-300">
            {bankData.currency || 'USD'}
          </span>
        </div>
      </div>

      {/* Bank Contact & Support Links */}
      {(bankData.phone || bankData.website) && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          {bankData.phone && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <Phone className="w-3 h-3 text-cyan-400" />
              {bankData.phone}
            </span>
          )}
          {bankData.website && (
            <a
              href={`https://${bankData.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-mono"
            >
              <span>{bankData.website}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
