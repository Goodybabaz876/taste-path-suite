import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Flame } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "sonner";
import { useAuth } from "@/hooks/use-auth";

// Routes that are accessible without being signed in
const PUBLIC_PATHS = ["/auth", "/reset-password"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try refreshing or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ELIZADE FOODS — Order food from the comfort of your hostel" },
      { name: "description", content: "Order Jollof, Egusi, Suya, Pounded Yam and other favorites from ELIZADE FOODS. Real-time tracking, quick delivery, and repeat-order in one tap." },
      { property: "og:title", content: "ELIZADE FOODS — Delicious food, delivered." },
      { property: "og:description", content: "Order fresh meals from ELIZADE FOODS with live order tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Figtree:wght@300;400;500;600;700&display=swap" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

/** Branded full-screen loading spinner shown while auth state resolves */
function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0E1B31]">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#F2A900] shadow-xl">
        <Flame className="h-8 w-8 text-[#1A2B4C]" />
      </div>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
        <div className="h-full animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-[#F2A900]" />
      </div>
      <style>{`
        @keyframes loading {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

/** Global auth guard — every child route passes through here */
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) {
      // Not signed in — redirect to /auth, preserving intended destination
      nav({ to: "/auth", search: { redirect: pathname } as never });
    }
    if (user && pathname === "/auth") {
      // Already signed in — send away from auth page
      nav({ to: "/" });
    }
  }, [user, loading, isPublic, pathname, nav]);

  // Show branded spinner while auth resolves
  if (loading) return <AuthLoading />;

  // If not authed and not on a public page, show nothing (redirect is in-flight)
  if (!user && !isPublic) return null;

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW registration failed:", err));
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <AuthGuard>
          <Outlet />
        </AuthGuard>
        <Toaster theme="dark" position="top-center" richColors />
      </CartProvider>
    </QueryClientProvider>
  );
}
