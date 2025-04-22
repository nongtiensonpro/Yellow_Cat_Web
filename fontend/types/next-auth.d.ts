import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Mở rộng kiểu Session mặc định
   */
  interface Session {
    accessToken?: string;
    error?: string;
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
    user?: {
      id?: string;
      name?: string;
      email?: string;
    };
  }
}