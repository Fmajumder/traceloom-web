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
        <footer style={{
          textAlign: 'center',
          padding: '1.25rem 1rem',
          fontSize: '0.75rem',
          color: '#6b7280',
          borderTop: '1px solid #1f2937',
          backgroundColor: '#0a0a0a',
          letterSpacing: '0.02em',
        }}>
          Copyright &copy; 2026 TraceLoom. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
