import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/sign-in", "/sign-up", "/share/", "/caregiver/", "/api/caregiver/"];

export default clerkMiddleware(async (auth, request) => {
  const start = Date.now();
  const { pathname, search } = new URL(request.url);

  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p));
  if (!isPublic) {
    await auth.protect();
  }

  const response = NextResponse.next();

  // Log every request: method, path, query, status, duration
  const duration = Date.now() - start;
  const isApi = pathname.startsWith("/api/");
  const color = isApi ? "\x1b[36m" : "\x1b[90m"; // cyan for API, gray for pages
  const reset = "\x1b[0m";
  const qs = search ? `\x1b[33m${search}${reset}` : "";
  console.log(
    `${color}${request.method.padEnd(6)}${reset} ${pathname}${qs}  \x1b[2m${duration}ms${reset}`
  );

  return response;
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
