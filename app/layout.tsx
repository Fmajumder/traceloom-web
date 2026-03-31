import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceLoom – Roll-Level Textile Traceability",
  description: "Real-time supply chain visibility for textile mills. Track every roll from production floor to delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
