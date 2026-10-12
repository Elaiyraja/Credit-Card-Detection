import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Activity, MapPin, Building, CreditCard } from 'lucide-react';

export default function RiskScoreCard({ assessment, binData }) {
  if (!assessment) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-slate-400 flex flex-col items-center justify-center min-h-[220px]">
        <Activity className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <p className="text-sm">Awaiting card telemetry to compute risk metrics...</p>
      </div>
    );
  }

  const { score, decision, recommendation, flags } = assessment;

  // Determine severity aesthetics
  const getSeverityStyle = () => {
    if (decision === 'BLOCKED' || score >= 75) {
      return {
        badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        bar: 'bg-gradient-to-r from-orange-500 to-rose-600',
        text: 'text-rose-400',
        icon: <ShieldAlert className="w-5 h-5 text-rose-400" />
      };
    }
    if (decision === 'REVIEW' || score >= 45) {
      return {
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        bar: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        text: 'text-amber-400',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
      };
    }
    return {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      bar: 'bg-gradient-to-r from-cyan-500 to-emerald-500',
      text: 'text-emerald-400',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />
    };
  };

  const style = getSeverityStyle();

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
      {/* Risk Gauge Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {style.icon}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Heuristic Risk Assessment
            </h4>
            <p className="text-[11px] text-slate-500">Live multi-vector anomaly analysis</p>
          </div>
        </div>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wide flex items-center gap-1 ${style.badge}`}
        >
          {decision}
        </span>
      </div>

      {/* Numerical Score meter */}
      <div className="mt-4">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs text-slate-400 font-medium">Composite Risk Probability:</span>
          <span className={`text-xl font-mono font-bold ${style.text}`}>
            {score} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${style.bar}`}
            style={{ width: `${Math.max(5, score)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>0 (Benign)</span>
          <span>45 (3DS Review)</span>
          <span>75+ (Auto-Block)</span>
        </div>
      </div>

      {/* Issuer & BIN Data Section */}
      {binData && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Issuing Bank</span>
            </div>
            <div className="font-semibold text-slate-200 truncate">
              {binData.bank?.name || 'Unknown Clearing Entity'}
            </div>
          </div>

          <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Country of Origin</span>
            </div>
            <div className="font-semibold text-slate-200 truncate flex items-center gap-1">
              <span>{binData.country?.emoji}</span>
              <span>{binData.country?.name || 'Global'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation and Flags */}
      <div className="mt-4 space-y-2">
        <p className="text-xs text-slate-300 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
          💡 {recommendation}
        </p>

        {flags && flags.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Triggered Risk Signals ({flags.length}):
            </div>
            {flags.map((flag, i) => (
              <div
                key={i}
                className="text-[11px] p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2 text-slate-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-mono font-bold text-slate-200">{flag.code}: </span>
                  <span className="text-slate-400">{flag.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
