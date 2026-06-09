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
          <footer className="border-t border-[var(--border)] bg-[var(--background-secondary)] py-6 px-4 mt-8">
            <div className="container mx-auto max-w-6xl text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
                Examen Anestesiología Pediátrica
              </p>
              <p className="text-sm font-medium text-[var(--foreground)] mt-1">
                Dra. Mariana Toledo Ángeles
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                Anestesióloga Pediatra
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
