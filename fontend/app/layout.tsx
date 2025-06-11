import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import React from "react";
import { NextUIProvider } from "@nextui-org/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sneaker Peak",
  description: "Cat Cat Cat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextUIProvider>
          <Providers>
            <Navbar />
            {children}
            <Footer />
          </Providers>
        </NextUIProvider>
      </body>
    </html>
  );
}
