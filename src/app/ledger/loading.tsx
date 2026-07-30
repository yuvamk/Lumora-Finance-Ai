import React from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function LedgerLoading() {
  return (
    <PageSkeleton
      sectionTitle="Timeline"
      pageTitle="Ledger Journal"
      cardCount={4}
    />
  );
}
