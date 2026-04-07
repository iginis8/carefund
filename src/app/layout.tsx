import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareFund - Financial Protection for Family Caregivers",
  description:
    "Track expenses, find tax credits, and build savings. The financial toolkit designed for America's 59 million family caregivers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
