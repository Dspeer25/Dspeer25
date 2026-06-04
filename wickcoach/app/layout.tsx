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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=DM+Mono:wght@300;400;500&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#212121] text-[#e2e8f0]">
        {children}
      </body>
    </html>
  );
}
