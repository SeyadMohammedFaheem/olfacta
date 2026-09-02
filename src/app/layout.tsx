import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Olfacta — Professional Perfume Formulation",
  description: "Create, validate, version, and scale fragrance formulas from one professional workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
