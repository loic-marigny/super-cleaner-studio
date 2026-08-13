import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, FileText } from "lucide-react";
import { FileDrop } from "@/components/sp/FileDrop";
import { Logo } from "@/components/sp/Logo";
import { SpButton } from "@/components/sp/Button";
import { translateGlobal, useI18n } from "@/lib/i18n";
import { buildSiteUrl } from "@/lib/site-url";
import { useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/")({
  head: () => {
    const canonical = buildSiteUrl("/");

    return {
      meta: [
      { title: translateGlobal("landing.meta.title") },
      {
        name: "description",
        content: translateGlobal("landing.meta.description"),
      },
      ...(canonical ? [{ property: "og:url", content: canonical }] : []),
    ],
      links: canonical ? [{ rel: "canonical", href: canonical }] : [],
    };
  },
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const { t } = useI18n();

  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[var(--color-surface-raised)] to-transparent" />

      <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3 py-1 text-[11px] font-medium text-[var(--color-brown)] bevel">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            {t("landing.badge")}
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--color-brown-dark)] sm:text-5xl">
            {t("landing.titleLine1")}
            <br />
            <span className="text-[var(--color-brown)]">{t("landing.titleLine2")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-brown)]">
            {t("landing.description")}
          </p>
        </div>

        <div className="mt-10">
          <FileDrop
            onFile={async (file) => {
              await workspace.importFile(file);
              navigate({ to: "/workspace" });
            }}
            onDemo={async () => {
              await workspace.loadDemo();
              navigate({ to: "/workspace" });
            }}
            disabled={workspace.status === "importing"}
          />
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <StepCard n={1} title={t("landing.steps.importTitle")} text={t("landing.steps.importText")} />
          <StepCard n={2} title={t("landing.steps.analysisTitle")} text={t("landing.steps.analysisText")} />
          <StepCard n={3} title={t("landing.steps.exportTitle")} text={t("landing.steps.exportText")} />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <SpButton
            variant="secondary"
            onClick={async () => {
              await workspace.loadDemo();
              navigate({ to: "/workspace" });
            }}
            trailingIcon={<ArrowRight className="h-4 w-4" />}
          >
            {t("landing.actions.demo")}
          </SpButton>
          <SpButton variant="ghost" onClick={() => navigate({ to: "/about" })} leadingIcon={<FileText className="h-4 w-4" />}>
            {t("landing.actions.about")}
          </SpButton>
        </div>

        <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6 text-[12px] text-[var(--color-brown)]/80">
          <Logo size="sm" showWordmark />
          <div className="flex items-center gap-4">
            <span>{t("landing.footer")}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StepCard({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-brown-dark)] text-[11px] font-bold text-[var(--color-surface-raised)] bevel">
          {n}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-brown-dark)]">{title}</h3>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-brown)]">{text}</p>
    </div>
  );
}
