"use client";

import { SessionProvider } from "next-auth/react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider attribute="class" defaultTheme="system">
          {children}
          <ToastProvider 
            placement="top-right"
            maxVisibleToasts={5}
            disableAnimation={false}
          />
        </NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
