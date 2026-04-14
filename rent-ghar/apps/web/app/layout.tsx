import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "PropertyDealer.pk - Pakistan's #1 Property Portal",
    template: "%s | PropertyDealer.pk",
  },
  description:
    "Pakistan's #1 property portal. Check today's cement rate, materials prices, buy or rent properties, book hotels, and more.",
  keywords: [
    "property dealer pakistan",
    "cement rate today",
    "materials price pakistan",
    "buy property pakistan",
    "hotels pakistan",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster richColors position="top-right" />
            </CartProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}