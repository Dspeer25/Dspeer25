import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Journal — Your Edge, Systemized",
  description: "The trading journal built by a trader, for traders. Track executions, journal your process, and find your edge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#12121a',
          colorInputBackground: '#0a0a0f',
          colorInputText: '#e4e4e7',
          colorText: '#e4e4e7',
        }
      }}
    >
      <html lang="en">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
