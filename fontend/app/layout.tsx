import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import AppLayout from "@/components/AppLayout";
import React from "react";
import { Toaster } from 'react-hot-toast';

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
        <Toaster position="top-center" />
        <AppLayout>{children}</AppLayout>
      </Providers>
      </body>
      </html>
  );
}

