import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css"; // Ensure this path is correct
import Providers from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer"; // <--- IMPORT FOOTER Ở ĐÂY

import LoadingAnimation from "@/components/LoadingAnimation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yellow Cat Web",
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
          <Navbar />
          {children}
          {/*<div>*/}
          {/*  <LoadingAnimation/>*/}
          {/*</div>*/}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
