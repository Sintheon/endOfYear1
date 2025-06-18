import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const url = req.nextUrl.clone();
  const path = url.pathname;

  if (path === '/bankas') {
    return NextResponse.next();
  }

  if (!token) {
    url.pathname = "/bankas";
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/bankas/admin') && token.role !== 'admin') {
    if (token.id) {
      url.pathname = `/bankas/users/${token.id}`;
      return NextResponse.redirect(url);
    } else {
      url.pathname = '/bankas/home';
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith('/bankas/users/')) {
    const pathSegments = path.split('/');
    const requestedUserId = pathSegments[3];
    
    if (token.role !== 'admin' && token.id !== requestedUserId) {
      url.pathname = `/bankas/users/${token.id}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/bankas/admin/:path*',
    '/bankas/users/:path*',
    '/bankas/transactions',
    '/bankas/stocks',
    '/bankas/home'
  ],
};