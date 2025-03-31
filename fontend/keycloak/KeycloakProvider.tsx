"use client";

import { ReactNode, useEffect } from "react";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloak";
import { useAuthStore } from "./store";
import { useRouter, usePathname } from "next/navigation";

interface KeycloakProviderProps {
  children: ReactNode;
}

export default function KeycloakProvider({ children }: KeycloakProviderProps) {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname(); // Lấy route hiện tại

  const eventLogger = (event: unknown, error: unknown) => {
    console.log("onKeycloakEvent", event, error);
  };

  const tokenLogger = async (tokens: any) => {
    console.log("onKeycloakTokens", tokens);

    if (keycloak.authenticated) {
      try {
        const profile = await keycloak.loadUserProfile();
        console.log("Authenticated user:", profile);
        setAuth(true, profile);
        document.cookie = `token=${keycloak.token}; path=/; max-age=3600; SameSite=Lax`;
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setAuth(false, null);
        if (pathname.startsWith("/admin")) {
          router.push("/login");
        }
      }
    } else {
      setAuth(false, null);
      if (pathname.startsWith("/admin")) {
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: "check-sso",
          silentCheckSsoRedirectUri:
              window.location.origin + "/silent-check-sso.html",
        });

        if (authenticated) {
          const profile = await keycloak.loadUserProfile();
          console.log("Authenticated user:", profile);
          setAuth(true, profile);
          document.cookie = `token=${keycloak.token}; path=/; max-age=3600; SameSite=Lax`;
        } else {
          setAuth(false, null);
          // Chỉ redirect nếu đang ở route /admin/*
          if (pathname.startsWith("/admin")) {
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Keycloak initialization failed:", error);
        setAuth(false, null);
        if (pathname.startsWith("/admin")) {
          router.push("/login");
        }
      }finally {
        await initKeycloak();
      }
    };



    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).then((refreshed: any) => {
        if (refreshed) {
          document.cookie = `token=${keycloak.token}; path=/; max-age=3600; SameSite=Lax`;
          console.log("Token refreshed:", keycloak.token);
        }
      });
    };
  }, [setAuth, router, pathname]);

  return (
      <ReactKeycloakProvider
          authClient={keycloak}
          onEvent={eventLogger}
          onTokens={tokenLogger}
      >
        {children}
      </ReactKeycloakProvider>
  );
}