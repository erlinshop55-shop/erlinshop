// src/proxy.ts (Next.js 16 file convention)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Hanya /admin/* yang diproteksi, KECUALI sign-in
const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isPublicAdminRoute = createRouteMatcher(['/admin/sign-in(.*)', '/admin/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) && !isPublicAdminRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals dan static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
