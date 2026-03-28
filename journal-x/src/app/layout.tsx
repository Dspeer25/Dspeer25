import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
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
          <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased">
          {children}
          {/* Aggressively remove Clerk dev mode banners via DOM observer */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              function killClerkDev(){
                document.querySelectorAll('div[style*="position: fixed"]').forEach(function(el){
                  var s = el.getAttribute('style') || '';
                  var t = el.textContent || '';
                  if((s.indexOf('bottom')!==-1 && (s.indexOf('z-index')!==-1 || s.indexOf('left')!==-1)) ||
                     t.indexOf('Development')!==-1 || t.indexOf('development')!==-1 ||
                     t.indexOf('Clerk')!==-1 || t.indexOf('pk_test')!==-1){
                    el.remove();
                  }
                });
              }
              killClerkDev();
              var o = new MutationObserver(function(){ killClerkDev(); });
              o.observe(document.body, { childList: true, subtree: true });
            })();
          `}} />
        </body>
      </html>
    </ClerkProvider>
  );
}
