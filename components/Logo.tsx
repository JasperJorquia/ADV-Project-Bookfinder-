"use client";

import React from "react";

type Props = {
  className?: string;
};

export default function Logo({ className = "w-12 h-12" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Book Reading Hub logo"
    >
      {/* Circle background */}
      <circle cx="100" cy="100" r="95" fill="#1e3a5f" />
      
      {/* Book */}
      <g transform="translate(100, 85)">
        {/* Left page */}
        <path d="M -35 -15 L -10 -15 L -8 40 L -35 38 Z" fill="none" stroke="#e8e8e8" strokeWidth="2" strokeLinejoin="round" />
        {/* Right page */}
        <path d="M 10 -15 L 35 -15 L 35 38 L 8 40 Z" fill="none" stroke="#e8e8e8" strokeWidth="2" strokeLinejoin="round" />
        {/* Book spine */}
        <path d="M -8 -15 L 8 -15 L 8 40 L -8 40 Z" fill="#f0f0f0" stroke="#e8e8e8" strokeWidth="2" />
        
        {/* Text lines on pages */}
        <line x1="-30" y1="0" x2="-15" y2="0" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.7" />
        <line x1="-30" y1="8" x2="-15" y2="8" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.7" />
        <line x1="-30" y1="16" x2="-15" y2="16" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.7" />
        <line x1="-30" y1="24" x2="-15" y2="24" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.7" />
        
        <line x1="15" y1="0" x2="30" y2="0" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.7" />
        <line x1="15" y1="8" x2="30" y2="8" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.7" />
        <line x1="15" y1="16" x2="30" y2="16" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.7" />
        <line x1="15" y1="24" x2="30" y2="24" stroke="#e8e8e8" strokeWidth="1.5" opacity="0.7" />
      </g>

      {/* Decorative ribbon elements */}
      <g transform="translate(145, 30)">
        <path d="M 0 0 Q 5 10 0 20" stroke="#e8e8e8" strokeWidth="2" fill="none" />
        <path d="M 8 5 Q 13 15 8 25" stroke="#e8e8e8" strokeWidth="2" fill="none" />
        <path d="M 16 10 Q 21 20 16 30" stroke="#e8e8e8" strokeWidth="2" fill="none" />
      </g>
    </svg>
  );
}
