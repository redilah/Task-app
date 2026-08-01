import React from 'react';

export default function PuncakLogo({ className = "w-8 h-8 text-slate-800" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="5.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Garis Dasar / Base Line */}
      <path d="M 12 85 L 88 85" />
      
      {/* Kontur Utama Puncak Gunung Geometris */}
      <path d="M 12 85 L 30 55 L 38 64 L 50 16 L 62 64 L 70 52 L 88 85" />
      
      {/* Garis Lipatan / Ridge Dalam */}
      <path d="M 30 55 L 38 64" />
      <path d="M 50 38 L 62 64" />
    </svg>
  );
}
