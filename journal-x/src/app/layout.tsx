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
          <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Orbitron:wght@400;500;600;700;800;900&family=Share+Tech+Mono&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased">
          {children}
          {/* Aggressively remove Clerk dev mode banners via DOM observer */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              function killClerkDev(){
                document.querySelectorAll('div[style*="position: fixed"], div[role="status"], div[role="alert"], div[data-clerk-toast], div[class*="toast"]').forEach(function(el){
                  var s = el.getAttribute('style') || '';
                  var t = (el.textContent || '').toLowerCase();
                  var isFixed = s.indexOf('position: fixed') !== -1 || s.indexOf('position:fixed') !== -1;
                  var isClerk = t.indexOf('development') !== -1 || t.indexOf('clerk') !== -1 || t.indexOf('pk_test') !== -1;
                  var isBottom = s.indexOf('bottom') !== -1;
                  var isToast = el.hasAttribute('data-clerk-toast') || (el.className && el.className.toString().indexOf('toast') !== -1);
                  if(isToast || (isFixed && (isBottom || isClerk)) || (isFixed && !el.id && !el.className)){
                    el.remove();
                  }
                });
              }
              killClerkDev();
              setInterval(killClerkDev, 500);
              var o = new MutationObserver(function(){ killClerkDev(); });
              o.observe(document.body, { childList: true, subtree: true });
            })();
          `}} />
        </body>
      </html>
    </ClerkProvider>
  );
}
