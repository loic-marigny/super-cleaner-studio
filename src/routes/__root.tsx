import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppHeader } from "../components/sp/AppHeader";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bevel bg-[var(--color-surface-raised)] font-mono text-lg font-bold text-[var(--color-brown-dark)]">
          404
        </div>
        <h1 className="mt-4 text-xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-sm text-[var(--color-brown)]">
          Cette adresse n'existe pas dans Super Pipeline.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-[var(--color-brown-dark)] px-4 py-2 text-sm font-medium text-[var(--color-surface-raised)] bevel transition-colors hover:bg-[var(--color-brown)]"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Cette page ne s'est pas chargée</h1>
        <p className="mt-2 text-sm text-[var(--color-brown)]">
          Une erreur inattendue est survenue. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-[var(--color-brown-dark)] px-4 py-2 text-sm font-medium text-[var(--color-surface-raised)] bevel hover:bg-[var(--color-brown)]"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface)]"
          >
            Accueil
          </a>
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
      { title: "Super Pipeline — Nettoyer vos fichiers Excel et CSV, localement" },
      {
        name: "description",
        content:
          "Super Pipeline est un petit utilitaire gratuit pour nettoyer et standardiser vos fichiers .xlsx et .csv, directement dans le navigateur. Sans compte, sans stockage.",
      },
      { name: "author", content: "Super Pipeline" },
      { property: "og:title", content: "Super Pipeline — Nettoyer vos fichiers Excel et CSV" },
      {
        property: "og:description",
        content:
          "Un petit utilitaire local pour analyser, nettoyer et standardiser vos fichiers de données. Aucun compte, aucun stockage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F4F1EA" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <AppHeader />
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}
