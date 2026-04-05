import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "VendorPulse", template: "%s | VendorPulse" },
  description: "Manage every vendor relationship with precision",
  keywords: ["vendor management", "spend analytics", "procurement", "risk monitoring"],
  authors: [{ name: "VendorPulse" }],
  openGraph: {
    title: "VendorPulse",
    description: "Enterprise vendor relationship management and spend analytics",
    type: "website",
    url: "https://vendorpulse.io",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}