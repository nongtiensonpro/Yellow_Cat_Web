import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import AppLayout from "@/components/AppLayout";
import React from "react";

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
      <Providers>
        <AppLayout>{children}</AppLayout>
      </Providers>
      </body>
      </html>
  );
}

