import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Julie & Nick — January 14, 2027",
  description:
    "Join Julie and Nick on January 14, 2027 at The Social Chapel in Jacksonville, Florida.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `data-scroll-behavior="smooth"` is required in Next 16: it no longer
    // overrides a global `scroll-behavior: smooth` during route transitions,
    // so without this every nav click animates instead of jumping.
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
