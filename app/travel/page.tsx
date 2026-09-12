import type { Metadata } from "next";
import { WipPage } from "@/components/wip-page";

export const metadata: Metadata = {
  title: "Travel & Accommodations — Julie & Nick",
};

export default function TravelPage() {
  return (
    <WipPage
      title="Travel & Accommodations"
      description="Getting to Jacksonville, where to stay, and how to reach the venue."
    />
  );
}
