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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StorageWarning />
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
