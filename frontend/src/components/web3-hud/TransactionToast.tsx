'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';

export type TxStatus = 'idle' | 'mining' | 'confirmed' | 'failed';

export interface TransactionToastProps {
  status: TxStatus;
  txHash: `0x${string}` | string | null;
  chainId?: number;
  title?: string;
  description?: string;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function TransactionToast({
  status,
  txHash,
  chainId = 80002,
  title,
  description,
  onDismiss,
  autoDismissMs = 5000,
}: TransactionToastProps) {
  const [progress, setProgress] = useState(100);

  // Auto-dismiss countdown on confirmed or failed
  useEffect(() => {
    if (status !== 'confirmed' && status !== 'failed') {
      setProgress(100);
      return;
    }

    const interval = 50; // update every 50ms
    const totalSteps = autoDismissMs / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const remainingPercent = Math.max(0, 100 - (step / totalSteps) * 100);
      setProgress(remainingPercent);

      if (remainingPercent <= 0) {
        clearInterval(timer);
        if (onDismiss) onDismiss();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [status, autoDismissMs, onDismiss]);

  if (status === 'idle' || !status) return null;

  // Explorer link resolver
  const getExplorerUrl = (hash: string) => {
    if (chainId === 84532) {
      return `https://sepolia.basescan.org/tx/${hash}`;
    }
    return `https://amoy.polygonscan.com/tx/${hash}`;
  };

  const explorerUrl = txHash ? getExplorerUrl(txHash) : null;
  const shortHash = txHash ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}` : null;

  const config = {
    mining: {
      defaultTitle: 'Minting on Sovereign Ledger',
      defaultDesc: 'Transaction broadcasted to Amoy validators...',
      icon: <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />,
      border: 'border-amber-500/50',
      bg: 'bg-stone-950/90 shadow-amber-500/10',
      barColor: 'bg-amber-400',
      badge: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
      badgeText: 'MINING',
    },
    confirmed: {
      defaultTitle: 'Decree Inscribed on Chain',
      defaultDesc: 'Transaction confirmed with state finalized.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />,
      border: 'border-emerald-500/50',
      bg: 'bg-stone-950/90 shadow-emerald-500/20',
      barColor: 'bg-emerald-400',
      badge: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
      badgeText: 'CONFIRMED',
    },
    failed: {
      defaultTitle: 'Transaction Reverted',
      defaultDesc: 'Execution failed or rejected by wallet.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      border: 'border-rose-500/50',
      bg: 'bg-stone-950/90 shadow-rose-500/20',
      barColor: 'bg-rose-400',
      badge: 'text-rose-300 bg-rose-400/10 border-rose-400/30',
      badgeText: 'FAILED',
    },
  }[status];

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-2xl shadow-2xl p-4 transition-all duration-300 ${config.bg} ${config.border}`}
      >
        {/* Progress bar countdown */}
        {(status === 'confirmed' || status === 'failed') && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <div
              className={`h-full transition-all duration-75 ease-linear ${config.barColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="mt-0.5 flex-shrink-0">{config.icon}</div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-serif font-bold text-sm text-stone-100 truncate">
                {title || config.defaultTitle}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-wider uppercase ${config.badge}`}
              >
                {config.badgeText}
              </span>
            </div>

            <p className="mt-1 text-xs text-stone-400 leading-snug">
              {description || config.defaultDesc}
            </p>

            {/* PolygonScan Link */}
            {explorerUrl && shortHash && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-stone-300 hover:text-white transition-colors group"
              >
                <span>{shortHash}</span>
                <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-white transition-colors" />
              </a>
            )}
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionToast;
