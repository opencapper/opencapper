import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api/|_next/|_vercel|\\.well-known|.*\\.(?:ico|png|jpg|jpeg|svg|webp|avif|gif|css|map|txt|xml|json|woff|woff2|ttf|otf)).*)",
  ],
};
