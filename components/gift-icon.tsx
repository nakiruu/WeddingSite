import type { Gift } from "@/lib/site-config";

const paths: Record<Gift["icon"], React.ReactNode> = {
  espresso: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="1" />
      <circle cx="12" cy="8" r="3" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </>
  ),
  mixer: (
    <>
      <path d="M6 3h9a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4h-2" />
      <path d="M6 3v18" />
      <path d="M10 14v3a3 3 0 0 1-3 3" />
      <ellipse cx="14" cy="19" rx="5" ry="2.5" />
    </>
  ),
  ricecooker: (
    <>
      <path d="M4 10h16v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7Z" />
      <path d="M3 10h18" />
      <path d="M8 6c0-1.5 1.5-2 1.5-3.5" />
      <path d="M12 6c0-1.5 1.5-2 1.5-3.5" />
      <path d="M16 6c0-1.5 1.5-2 1.5-3.5" />
    </>
  ),
};

export function GiftIcon({ name }: { name: Gift["icon"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="size-12 text-mulberry"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
