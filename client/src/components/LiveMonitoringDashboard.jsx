import React from 'react';
import { Activity, CheckCircle2, AlertOctagon, XCircle, Clock, Zap, TrendingUp } from 'lucide-react';

export default function LiveMonitoringDashboard({ metrics, recentTransactions }) {
  const {
    totalProcessed = 0,
    approvedCount = 0,
    flaggedCount = 0,
    blockedCount = 0,
    averageLatencyMs = 210,
    totalVolume = 0
  } = metrics || {};

  const approvalRate = totalProcessed > 0
    ? Math.round((approvedCount / totalProcessed) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled Volume</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            ${Number(totalVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-cyan-400 font-semibold">{totalProcessed}</span> txns monitored
          </div>
        </div>

        {/* Approval Rate */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approval Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {approvalRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400">{approvedCount}</span> approved
          </div>
        </div>

        {/* Flagged & Blocked */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked Fraud</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-rose-400">
            {blockedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-amber-400">{flaggedCount}</span> under review
          </div>
        </div>

        {/* Real-Time Latency */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Processing Latency</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {averageLatencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Sub-second gateway pipeline
          </div>
        </div>
      </div>

      {/* Real-Time Transaction Telemetry Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Live Gateway Stream & Risk Telemetry
            </h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            WebSocket Connected
          </span>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 uppercase font-mono tracking-wider">
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Instrument</th>
                <th className="pb-3 font-semibold">Issuer / Origin</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Risk Score</th>
                <th className="pb-3 font-semibold">Latency</th>
                <th className="pb-3 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const isSuccess = tx.status === 'APPROVED';
                  const isBlocked = tx.status === 'BLOCKED';
                  const badgeClass = isSuccess
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : isBlocked
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border uppercase ${badgeClass}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-200">
                        <span className="capitalize">{tx.cardBrand}</span> •••• {tx.cardLast4}
                      </td>
                      <td className="py-3 text-slate-300">
                        <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={tx.issuer}>
                          <span>{tx.flagEmoji || '🌐'}</span>
                          <span className="truncate">{tx.issuer}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono font-semibold text-slate-100">
                        ${tx.amount} <span className="text-[10px] text-slate-400">{tx.currency}</span>
                      </td>
                      <td className="py-3 font-mono">
                        <span
                          className={`font-semibold ${
                            tx.riskScore > 60
                              ? 'text-rose-400'
                              : tx.riskScore > 30
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {tx.riskScore}/100
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        {tx.latencyMs}ms
                      </td>
                      <td className="py-3 text-right font-mono text-slate-500">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 italic">
                    No transactions captured yet. Run a payment test on the left panel to populate live telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
