import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import AISidebar from '@/components/AISidebar';
import "./globals.css";

export const metadata: Metadata = {
  title: "Journal X — AI-Powered Trading Accountability",
  description: "The first interactive trading journal that holds you accountable. AI coaching, goal tracking, and real performance analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#111119',
          colorInputBackground: '#0c0c14',
          colorInputText: '#f0f0f5',
          colorText: '#f0f0f5',
        }
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Orbitron:wght@400;500;600;700;800;900&family=Share+Tech+Mono&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased">
          {children}
          <AISidebar />
        </body>
      </html>
    </ClerkProvider>
  );
}
