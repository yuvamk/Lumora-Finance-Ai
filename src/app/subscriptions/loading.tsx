import React from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function SubscriptionsLoading() {
  return (
    <PageSkeleton
      sectionTitle="Recurring"
      pageTitle="Subscriptions"
      cardCount={3}
      headerRight={true}
    />
  );
}
