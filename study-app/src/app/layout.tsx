import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import StorageWarning from "@/components/StorageWarning";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Examen Anestesiología Pediátrica",
  description: "Una aplicación para estudiar y practicar para el examen de anestesiología pediátrica, con exámenes de práctica, estadísticas y más. Desarrollada por Juan Maldonado para la Doctora Mariana Alejandra Toledo Angeles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <StorageWarning />
        <Providers>
          <Navigation />
          <main className="flex-1 w-full">
            {children}
          </main>
          <footer className="border-t border-[var(--border)] bg-[var(--background-secondary)] py-8 px-4 mt-12">
            <div className="container mx-auto max-w-6xl flex flex-col items-center text-center gap-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Dra. Mariana Toledo Angeles
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                Anestesióloga Pediatra
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-2">
                Examen de Anestesiología Pediátrica · {new Date().getFullYear()}
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
