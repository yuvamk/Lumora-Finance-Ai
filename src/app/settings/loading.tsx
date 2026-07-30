import React from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function SettingsLoading() {
  return (
    <PageSkeleton
      sectionTitle="Preferences"
      pageTitle="Control Center"
      cardCount={3}
    />
  );
}
