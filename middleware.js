import { NextResponse } from 'next/server';

// Subdomain → book slug routing
// ezra.edu.awakeningdestiny.global → /books/child-education
const SUBDOMAIN_MAP = {
  'ezra.edu.awakeningdestiny.global': '/books/child-education',
};

export function middleware(req) {
  const host = req.headers.get('host') || '';
  const target = SUBDOMAIN_MAP[host];

  if (target) {
    const url = req.nextUrl.clone();

    // If they land at the root, rewrite to the book page
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = target;
      return NextResponse.rewrite(url);
    }

    // Pass-through all other paths (api routes, _next assets, etc.)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
