/**
 * The nav logo: a rose that crossfades to a house on hover. The source
 * artboards achieved this with a per-artboard <style> block; here it is a
 * group-hover utility on a single wrapper.
 */
export function RoseIcon({ className = "" }: { className?: string }) {
  return (
    <span
      className={`group relative block size-7 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="absolute inset-0 size-7 opacity-100 transition-opacity duration-300 group-hover:opacity-0"
      >
        <path
          d="M14 4C14 4 16.5 2 18 3C19.5 4 18 7 17 8C16 9 14 10 14 10C14 10 12 9 11 8C10 7 8.5 4 10 3C11.5 2 14 4 14 4Z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M14 10C14 10 18 8 20 9.5C22 11 20 14 18.5 15C17 16 14 16.5 14 16.5C14 16.5 11 16 9.5 15C8 14 6 11 8 9.5C10 8 14 10 14 10Z"
          fill="currentColor"
          opacity="0.5"
        />
        <path
          d="M14 16.5C14 16.5 16 17 16.5 19C17 21 15 23 14 24C13 23 11 21 11.5 19C12 17 14 16.5 14 16.5Z"
          fill="currentColor"
          opacity="0.35"
        />
        <line
          x1="14"
          y1="16"
          x2="14"
          y2="26"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.4"
        />
        <path
          d="M14 20C14 20 11.5 18.5 10 19"
          stroke="currentColor"
          strokeWidth="0.8"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M14 22C14 22 16.5 20.5 18 21"
          stroke="currentColor"
          strokeWidth="0.8"
          fill="none"
          opacity="0.3"
        />
      </svg>
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="absolute inset-0 size-7 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <path
          d="M14 3L3 12H6V24H11V17H17V24H22V12H25L14 3Z"
          fill="currentColor"
          opacity="0.6"
        />
        <rect
          x="12"
          y="12"
          width="4"
          height="4"
          fill="currentColor"
          opacity="0.3"
        />
      </svg>
    </span>
  );
}
