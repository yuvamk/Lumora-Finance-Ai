import React from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function InsightsLoading() {
  return (
    <PageSkeleton
      sectionTitle="AI Advisory"
      pageTitle="Financial Insights"
      cardCount={3}
    />
  );
}
