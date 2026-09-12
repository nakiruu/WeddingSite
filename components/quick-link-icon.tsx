import type { QuickLink } from "@/lib/site-config";

const paths: Record<QuickLink["icon"], React.ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <polyline points="3 5 12 13 21 5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  plane: (
    <>
      <path d="M3 21L12 3L21 21H3Z" />
      <circle cx="12" cy="14" r="2" />
    </>
  ),
  gift: (
    <>
      <path d="M20 12V22H4V12" />
      <path d="M22 7H2V12H22V7Z" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7C12 7 12 3 8 3C6 3 5 4.5 5 6C5 7.5 7 7 12 7Z" />
      <path d="M12 7C12 7 12 3 16 3C18 3 19 4.5 19 6C19 7.5 17 7 12 7Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 9C9 7.5 10.5 6.5 12 6.5C13.5 6.5 15 7.5 15 9C15 10.5 13 11 12 12V14" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </>
  ),
  pin: (
    <>
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
};

export function QuickLinkIcon({ name }: { name: QuickLink["icon"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="size-6 text-mulberry"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
