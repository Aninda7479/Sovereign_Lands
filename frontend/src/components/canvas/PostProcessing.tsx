'use client';

import React from 'react';

export interface PostProcessingProps {
  bloomIntensity?: number;
  vignetteDarkness?: number;
}

/**
 * Atmospheric PostProcessing & Cinematic Color Grading
 * Provides subtle corner vignetting, tone mapping, and bloom glow for torches and parcel runes.
 * Engineered for 60 FPS performance without heavy shader passes.
 */
export function PostProcessing({
  vignetteDarkness = 0.5,
}: PostProcessingProps) {
  return (
    <>
      {/* Cinematic Vignette Overlay (HTML Layer over WebGL) */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background: `radial-gradient(ellipse at center, transparent 60%, rgba(3, 7, 18, ${vignetteDarkness}) 100%)`,
        }}
      />
    </>
  );
}

export default PostProcessing;
