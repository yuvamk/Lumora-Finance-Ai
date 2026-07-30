import React from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function BudgetsLoading() {
  return (
    <PageSkeleton
      sectionTitle="Limits Tracker"
      pageTitle="Budget Rules"
      cardCount={3}
      headerRight={true}
    />
  );
}
