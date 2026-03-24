import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl;
  
  if (url.pathname.startsWith('/admin')) {
    if (url.pathname.startsWith('/admin/login')) {
      return NextResponse.next();
    }
    
    const authCookie = request.cookies.get('admin_auth');
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
