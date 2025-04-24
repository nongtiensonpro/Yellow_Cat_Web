import NextAuth, {
    NextAuthOptions,
    User as NextAuthUser,
    Session as NextAuthSession,
    Account,
    Profile,
    User
} from "next-auth";
import { JWT } from "next-auth/jwt";
import { AdapterUser } from "next-auth/adapters";
import KeycloakProvider from "next-auth/providers/keycloak";
import {jwtDecode} from "jwt-decode";

interface RealmAccess {
    roles: string[];
}

interface ResourceAccess {
    [clientId: string]: {
        roles: string[];
    };
}

interface DecodedToken {
    realm_access?: RealmAccess;
    resource_access?: ResourceAccess;
    email?: string;
    name?: string;

    [key: string]: any;
}

interface CustomToken {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    roles?: string[];
    email?: string;
    name?: string;
    error?: string;
    sub?: string;

    [key: string]: any;
}

interface CustomUser extends Omit<NextAuthUser, 'id'> {
    id?: string;
    roles?: string[];
    email?: string;
    name?: string;
}

// @ts-ignore
interface CustomSession extends NextAuthSession {
    user?: CustomUser;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    error?: string;
    expiresAt?: number;
}

const ENV = {
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    keycloakIssuer: process.env.KEYCLOAK_ISSUER,
    keycloakDomain: process.env.KEYCLOAK_DOMAIN || "localhost:9082",
    nextAuthSecret: process.env.NEXTAUTH_SECRET
};

if (!ENV.keycloakClientId || !ENV.keycloakClientSecret || !ENV.keycloakIssuer) {
    throw new Error("Thiếu các biến môi trường cần thiết cho Keycloak Provider trong NextAuth.");
}

// Define authOptions but don't export it directly
const authOptions: NextAuthOptions = {
    providers: [
        KeycloakProvider({
            clientId: ENV.keycloakClientId,
            clientSecret: ENV.keycloakClientSecret,
            issuer: ENV.keycloakIssuer,
            authorization: {
                params: {scope: "openid profile email"}
            },
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, account, profile, user }: {
            token: JWT;
            user?: User | AdapterUser;
            account?: Account | null;
            profile?: Profile;
            isNewUser?: boolean;
        }): Promise<JWT> {
            const customToken = token as CustomToken;

            if (account) {
                customToken.id = (user as CustomUser)?.id ?? customToken.sub;
                customToken.accessToken = account.access_token;
                customToken.refreshToken = account.refresh_token;
                customToken.idToken = account.id_token;
                customToken.expiresAt = account.expires_at;

                // Giải mã lấy roles
                let decoded: DecodedToken | undefined;
                if (account.id_token) {
                    decoded = jwtDecode<DecodedToken>(account.id_token);
                } else if (account.access_token) {
                    decoded = jwtDecode<DecodedToken>(account.access_token);
                }

                if (decoded) {
                    customToken.roles =
                        decoded.realm_access?.roles ??
                        decoded.resource_access?.[ENV.keycloakClientId!]?.roles ??
                        [];
                    customToken.email = decoded.email ?? customToken.email;
                    customToken.name = decoded.name ?? customToken.name;
                }
            }
            if (profile) {
                const p = profile as DecodedToken;
                customToken.roles =
                    p.realm_access?.roles ??
                    p.resource_access?.[ENV.keycloakClientId!]?.roles ??
                    customToken.roles ??
                    [];
                customToken.email = p.email || customToken.email;
                customToken.name = p.name || customToken.name;
            }

            // Kiểm tra và làm mới token nếu sắp hết hạn (ví dụ: còn 60 giây)
            const now = Math.floor(Date.now() / 1000);
            const timeRemaining = (customToken.expiresAt ?? 0) - now;
            if (customToken.refreshToken && timeRemaining < 60) { // Làm mới nếu còn dưới 60 giây
                try {
                    // Construct the correct token endpoint URL from the issuer URL
                    const tokenEndpoint = `${ENV.keycloakIssuer}/protocol/openid-connect/token`;
                    const response = await fetch(tokenEndpoint, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: new URLSearchParams({
                            grant_type: 'refresh_token',
                            client_id: ENV.keycloakClientId!,
                            client_secret: ENV.keycloakClientSecret!,
                            refresh_token: customToken.refreshToken as string,
                        }),
                    });

                    const tokens = await response.json();

                    if (!response.ok) {
                        console.error("Error refreshing token:", tokens);
                        throw {
                            error: tokens.error || "RefreshAccessTokenError",
                            error_description: tokens.error_description || "Failed to refresh access token"
                        };
                    }

                    customToken.accessToken = tokens.access_token;
                    // Chỉ cập nhật refresh token nếu Keycloak trả về refresh token mới
                    customToken.refreshToken = tokens.refresh_token ?? customToken.refreshToken;
                    customToken.idToken = tokens.id_token; // Cập nhật idToken
                    customToken.expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;
                    const refreshed: DecodedToken = jwtDecode(tokens.access_token);
                    customToken.roles =
                        refreshed.realm_access?.roles ??
                        refreshed.resource_access?.[ENV.keycloakClientId!]?.roles ??
                        customToken.roles ??
                        [];
                } catch (error: any) {
                    console.error("Lỗi khi refresh token:", error);
                    // Nếu lỗi là 'invalid_grant', hủy phiên làm việc
                    if (error?.error === 'invalid_grant') {
                        console.log("Refresh token không hợp lệ hoặc đã hết hạn. Hủy phiên.");
                        // Trả về token với lỗi và xóa thông tin nhạy cảm để NextAuth hủy session
                        return {
                            ...customToken,
                            error: "RefreshAccessTokenError",
                            accessToken: undefined,
                            refreshToken: undefined,
                            expiresAt: 0 // Đặt thời gian hết hạn về 0
                        } as JWT;
                    }
                    // Đối với các lỗi khác, chỉ đánh dấu lỗi
                    customToken.error = "RefreshAccessTokenError";
                }
            }

            return customToken as JWT;
        },
        async session({session, token}) {
            const customSession = session as CustomSession;
            const customToken = token as CustomToken;

            if (!customSession.user) customSession.user = {};
            customSession.user.id = customToken.id || "";
            customSession.user.roles = customToken.roles ?? [];
            customSession.user.email = customToken.email || "";
            customSession.user.name = customToken.name || "";

            customSession.accessToken = customToken.accessToken;
            customSession.refreshToken = customToken.refreshToken;
            customSession.idToken = customToken.idToken;
            customSession.error = customToken.error;
            customSession.expiresAt = customToken.expiresAt;

            return customSession;
        }
    },
    secret: ENV.nextAuthSecret,
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
        signOut: '/auth/signout',
    },
    debug: false,
};

const handler = NextAuth(authOptions);

export {  handler as GET,handler as POST }