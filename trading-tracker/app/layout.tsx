import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Tracker",
  description: "Personal trade journal and log",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#0f1117] text-[#e2e8f0]">
        {children}
      </body>
    </html>
  );
}
