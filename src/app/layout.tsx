import type { Metadata } from "next";
import "./globals.css";
import AppWrapper from "@/components/layout/AppWrapper";

export const metadata: Metadata = {
  title: "Prevenort | Sistema Médico Fast-Track",
  description: "Plataforma de gestión de salud ocupacional para la minería",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
