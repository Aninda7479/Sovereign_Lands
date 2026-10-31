'use client';

import React from 'react';

interface UnderConstructionProps {
  moduleName: string;
  agentId: string;
  description?: string;
}

export function UnderConstruction({ moduleName, agentId, description }: UnderConstructionProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 m-2 border-2 border-dashed border-amber-500/50 rounded-xl bg-amber-950/20 backdrop-blur-sm text-center">
      <div className="text-3xl mb-2 animate-bounce">🚧</div>
      <h3 className="text-lg font-bold text-amber-300 font-serif tracking-wide">
        {moduleName} Under Construction
      </h3>
      <p className="text-xs text-amber-200/70 mt-1 max-w-sm">
        {description || 'This module is currently being constructed by its designated agent.'}
      </p>
      <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20">
        Assigned: {agentId.toUpperCase()}
      </div>
    </div>
  );
}

export default UnderConstruction;
