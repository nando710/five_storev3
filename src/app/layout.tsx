import type { Metadata } from "next";
import { Inter, Urbanist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

// Using Urbanist for headings (like the Auth page restyling requested previously)
const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: 'swap',
});

// Inter for body text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Five Store",
  description: "E-commerce platform para a rede de franqueados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${urbanist.variable} antialiased min-h-screen flex flex-col font-sans`}>
        <Navbar />
        <main className="flex-1 flex flex-col bg-muted/20">
          {children}
        </main>
      </body>
    </html>
  );
}
