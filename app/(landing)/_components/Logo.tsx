export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        className="fill-neutral-900 dark:fill-white"
      />
      <path
        d="M8 11.5 16 7l8 4.5v9L16 25l-8-4.5v-9Z"
        className="stroke-white dark:stroke-neutral-900"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 11.5 16 16m0 0 8-4.5M16 16v9"
        className="stroke-white dark:stroke-neutral-900"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
