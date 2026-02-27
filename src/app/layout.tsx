import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/store/CartDrawer";
import SidebarDemo from "@/components/sidebar-demo";

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
      <body className={`${inter.variable} antialiased h-screen flex flex-col font-sans bg-background`}>
        <SidebarDemo>
          {children}
        </SidebarDemo>
        <CartDrawer />
      </body>
    </html>
  );
}
