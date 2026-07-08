import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GratiFi",
  description: "Recognition infrastructure for real-world service moments."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
