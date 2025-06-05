// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react'; // Your NextAuth SessionProvider
import { NextUIProvider } from '@nextui-org/react';
import { useRouter } from 'next/router'; // Import useRouter for Pages Router
import { Navbar } from '@/components/navbar'; // Assuming your main Navbar is here
import '@/styles/globals.css'; // Your global CSS

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const pathname = router.pathname;
    const isAdminRoute = pathname.startsWith("/admin");

    return (
        <SessionProvider session={pageProps.session}>
            <NextUIProvider>
                {!isAdminRoute && <Navbar />}
                <Component {...pageProps} />
            </NextUIProvider>
        </SessionProvider>
    );
}

export default MyApp;