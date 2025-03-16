"use client";

import { ReactNode, useEffect } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';
import { useAuthStore } from './store';

interface KeycloakProviderProps {
  children: ReactNode;
}

export default function KeycloakProvider({ children }: KeycloakProviderProps) {
  const { setAuth } = useAuthStore();

  const eventLogger = (event: unknown, error: unknown) => {
    console.log('onKeycloakEvent', event, error);
  };

  const tokenLogger = (tokens: unknown) => {
    console.log('onKeycloakTokens', tokens);
  };

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        });
        if (authenticated) {
          const profile = await keycloak.loadUserProfile();
          setAuth(true, profile);
        } else {
          setAuth(false, null);
        }
      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        setAuth(false, null);
      }
    };

    initKeycloak();
  }, [setAuth]);

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