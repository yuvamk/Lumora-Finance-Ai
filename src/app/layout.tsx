import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/nav/app-layout";
import { TopHeader } from "@/components/nav/top-header";
import "./globals.css";

// Use system font variables for offline capability
const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "Lumora AI — Intelligent Personal Finance",
  description: "Understand every dollar. Predict every tomorrow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col text-foreground">
        <Providers>
          <AppLayout topHeader={<TopHeader />}>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
