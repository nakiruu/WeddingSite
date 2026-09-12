import type { Metadata } from "next";
import { WipPage } from "@/components/wip-page";

export const metadata: Metadata = { title: "Registry — Julie & Nick" };

export default function RegistryPage() {
  return (
    <WipPage
      title="Registry"
      description="Our wish list, for anyone who would like to give a gift."
    />
  );
}
