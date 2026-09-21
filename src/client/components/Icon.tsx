import React from "react";
export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, React.ReactNode> = {
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    moon: <path d="M20 14A8.5 8.5 0 0 1 10 3 8.5 8.5 0 1 0 20 14Z" />,
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 7a7.5 7.5 0 0 1 12-2L20 8M4 16l2.5 3a7.5 7.5 0 0 0 12-2" />
      </>
    ),
    share: (
      <>
        <path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    spark: (
      <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />
    ),
    paw: (
      <>
        <path d="M7 14c2-1 2-5 5-5s3 4 5 5c5 5-1 8-5 6-4 2-10-1-5-6Z" />
        <ellipse cx="4" cy="9" rx="2" ry="2.5" />
        <ellipse cx="9" cy="4" rx="2" ry="2.5" />
        <ellipse cx="15" cy="4" rx="2" ry="2.5" />
        <ellipse cx="20" cy="9" rx="2" ry="2.5" />
      </>
    ),
  };
  return (
    <svg
      className={`icon ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.spark}
    </svg>
  );
}
