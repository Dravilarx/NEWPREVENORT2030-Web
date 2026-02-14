import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

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
    <html lang="es">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .app-container {
            display: flex;
            min-height: 100vh;
          }
          .main-content {
            flex: 1;
            margin-left: 260px;
            padding: 2rem;
            background-color: var(--bg-app);
          }
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
            }
          }
        `}} />
      </body>
    </html>
  );
}
