import type { Metadata } from "next";
import { WipPage } from "@/components/wip-page";

export const metadata: Metadata = { title: "FAQ — Julie & Nick" };

export default function FaqPage() {
  return (
    <WipPage
      title="FAQ"
      description="Dress code, parking, children, and everything else you might be wondering."
    />
  );
}
