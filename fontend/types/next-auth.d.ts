import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Mở rộng kiểu Session mặc định
   */
  interface Session extends DefaultSession {
    accessToken?: string;
    error?: string;
    roles?: string[];
    user?: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
    };
  }

  /**
   * Mở rộng kiểu User mặc định nếu cần
   */
  interface User {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    accessToken?: string;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  /**
   * Mở rộng kiểu JWT mặc định
   */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    roles?: string[];
    user?: {
      id?: string;
      name?: string;
      email?: string;
    };
  }

  // Thêm khai báo getToken để TypeScript nhận diện hàm này
  interface GetTokenOptions {
    req: import("next").NextApiRequest | import("next/server").NextRequest;
    secret?: string;
    raw?: boolean;
  }

  export function getToken(options?: GetTokenOptions): Promise<JWT | null>;
}