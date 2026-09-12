import type { Metadata } from "next";
import { WipPage } from "@/components/wip-page";

export const metadata: Metadata = { title: "Schedule — Julie & Nick" };

export default function SchedulePage() {
  return (
    <WipPage
      title="Schedule"
      description="The timeline for the day — ceremony, cocktails, dinner and dancing."
    />
  );
}
