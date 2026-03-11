import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Client Portal",
  description: "Client portal powered by HaloPSA + SaaS connectors"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
          {children}
        </div>
      </body>
    </html>
  );
}

