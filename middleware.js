import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (!token) return false;

        const path = req.nextUrl.pathname;
        if (path.startsWith("/admin")) return token.role === "admin";

        // favorites requires any logged-in user
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/favorites/:path*"],
};