import React from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function ReportsLoading() {
  return (
    <PageSkeleton
      sectionTitle="Analytics"
      pageTitle="Reports"
      cardCount={3}
      headerRight={true}
    />
  );
}
