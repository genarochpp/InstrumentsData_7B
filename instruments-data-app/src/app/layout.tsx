import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chiarappa · Inventario de aviónica",
  description: "Control de instrumentos y equipos de aviónica de Chiarappa Instruments.",
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
