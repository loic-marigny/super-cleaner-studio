import { createFileRoute } from "@tanstack/react-router";
import { Cpu, EyeOff, Feather, Github, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/sp/Logo";
import { translateGlobal, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: translateGlobal("about.meta.title") },
      {
        name: "description",
        content: translateGlobal("about.meta.description"),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <div className="flex items-center justify-between">
        <Logo size="lg" />
        <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">{t("about.versionTag")}</span>
      </div>

      <h1 className="mt-8 text-3xl font-semibold text-[var(--color-brown-dark)]">{t("about.title")}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-brown)]">{t("about.description")}</p>

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        <Value icon={<ShieldCheck className="h-4 w-4" />} title={t("about.values.trustTitle")}>
          {t("about.values.trustText")}
        </Value>
        <Value icon={<EyeOff className="h-4 w-4" />} title={t("about.values.privacyTitle")}>
          {t("about.values.privacyText")}
        </Value>
        <Value icon={<Feather className="h-4 w-4" />} title={t("about.values.simplicityTitle")}>
          {t("about.values.simplicityText")}
        </Value>
        <Value icon={<Cpu className="h-4 w-4" />} title={t("about.values.localTitle")}>
          {t("about.values.localText")}
        </Value>
      </section>

      <section className="mt-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel">
        <h2 className="text-base font-semibold text-[var(--color-brown-dark)]">{t("about.license.title")}</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-brown)]">{t("about.license.text")}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-[13px]">
          <a
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 hover:bg-[var(--color-secondary)]"
            href="https://github.com/loic-marigny/super-cleaner-studio"
            rel="noreferrer"
            target="_blank"
          >
            <Github className="h-4 w-4" /> {t("about.license.source")}
          </a>
          <a
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 hover:bg-[var(--color-secondary)]"
            href="https://github.com/loic-marigny/super-cleaner-studio/issues"
            rel="noreferrer"
            target="_blank"
          >
            <Mail className="h-4 w-4" /> {t("about.license.contact")}
          </a>
        </div>
      </section>
    </div>
  );
}

function Value({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-secondary)] text-[var(--color-brown-dark)]">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-brown-dark)]">{title}</h3>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-brown)]">{children}</p>
    </div>
  );
}
