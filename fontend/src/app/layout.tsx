"use client";

import "./globals.css";
import KeycloakProvider from './auth/KeycloakProvider';
import SharedLayout from './shared-layout';
import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <KeycloakProvider>
          <SharedLayout>{children}</SharedLayout>
        </KeycloakProvider>
      </body>
    </html>
  );
}
