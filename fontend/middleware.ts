import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';



export function middleware(request: NextRequest) {

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('kc-access');

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const tokenParsed: any = jwtDecode(token.value);
      const clientId = 'YellowCatCompanyWeb';
      const clientRoles = clientId && tokenParsed.resource_access?.[clientId]?.roles || [];

      if (!clientRoles.includes('Admin_Web')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    } catch (error) {
      console.error('Error decoding token:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};