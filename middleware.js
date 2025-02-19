import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isPublicRoute = createRouteMatcher([]);

export default clerkMiddleware(async (auth, req) => {
  // Check if the route is protected
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (isPublicRoute(req)) {
    //if user not autheticated send to signin page
    if (!userId && !isPublicRoute(req)) return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (isAdminRoute(req)) {
    // Check if the user is authenticated
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Access the public metadata
    const publicMetadata = sessionClaims?.metadata;

    // Check if the user's role is 'admin'
    if (publicMetadata.role !== "admin") {
      return new Response("Forbidden: Admin access required", { status: 403 });
    }
  }
  // If the user is authenticated and has the 'admin' role, proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
