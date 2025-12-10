"use client";

import React from "react";

type Props = {
  className?: string;
};

export default function Logo({ className = "w-10 h-10 text-teal-600" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="BookFinder logo"
    >
      <path
        fill="currentColor"
        d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h9v12l-4.5-2.7L6 16V4z"
      />
    </svg>
  );
}
