import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arco · Inventario de instrumentos",
  description: "Inventario de instrumentos y equipos de Chiarappa Instruments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
