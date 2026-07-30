import React from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function GoalsLoading() {
  return (
    <PageSkeleton
      sectionTitle="Targets Manager"
      pageTitle="Savings Goals"
      cardCount={3}
      headerRight={true}
    />
  );
}
