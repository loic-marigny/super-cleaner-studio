import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { SpButton } from "@/components/sp/Button";
import { StatusBadge } from "@/components/sp/StatusBadge";
import { TextField } from "@/components/sp/TextField";
import { Toggle } from "@/components/sp/Toggle";
import { translateGlobal, useI18n } from "@/lib/i18n";
import { buildSiteUrl } from "@/lib/site-url";
import { useWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/settings")({
  head: () => {
    const canonical = buildSiteUrl("/settings");

    return {
      meta: [
      { title: translateGlobal("settings.meta.title") },
      {
        name: "description",
        content: translateGlobal("settings.meta.description"),
      },
      { name: "robots", content: "noindex, follow" },
      ...(canonical ? [{ property: "og:url", content: canonical }] : []),
    ],
      links: canonical ? [{ rel: "canonical", href: canonical }] : [],
    };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const [compact, setCompact] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [openIssues, setOpenIssues] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const { t } = useI18n();
  const workspace = useWorkspace();

  const resetPreferences = () => {
    setAutoDetect(true);
    setOpenIssues(false);
    setCompact(false);
    setResetVersion((current) => current + 1);
    workspace.resetPreferences();
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-brown-dark)]">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-[var(--color-brown)]">{t("settings.description")}</p>
      </header>

      <div className="space-y-4">
        <Section title={t("settings.sections.importTitle")} description={t("settings.sections.importDescription")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              key={`preferred-separator-${resetVersion}`}
              label={t("settings.fields.preferredSeparator")}
              defaultValue={t("settings.fields.preferredSeparatorDefault")}
              hint={t("settings.fields.preferredSeparatorHint")}
            />
          </div>
        </Section>

        <Section title={t("settings.sections.analysisTitle")} description={t("settings.sections.analysisDescription")}>
          <Toggle checked={autoDetect} onChange={setAutoDetect} label={t("settings.toggles.autoDetect")} />
          <Toggle checked={openIssues} onChange={setOpenIssues} label={t("settings.toggles.openIssues")} />
          <Toggle
            checked={workspace.removeEmptyColumnsOnImport}
            onChange={workspace.setRemoveEmptyColumnsOnImport}
            label={t("settings.toggles.removeEmptyColumns")}
          />
          <Toggle checked={compact} onChange={setCompact} label={t("settings.toggles.compact")} />
          <div className="flex justify-end pt-2">
            <SpButton
              variant="ghost"
              size="sm"
              leadingIcon={<Trash2 className="h-4 w-4" />}
              onClick={resetPreferences}
            >
              {t("settings.privacy.clearPreferences")}
            </SpButton>
          </div>
        </Section>

        <Section title={t("settings.sections.privacyTitle")} description={t("settings.sections.privacyDescription")}>
          <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <div className="flex items-center gap-2">
              <StatusBadge tone="success">{t("settings.badges.local")}</StatusBadge>
              <span className="text-[13px] text-[var(--color-brown-dark)]">{t("settings.privacy.localText")}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <div className="flex items-center gap-2">
              <StatusBadge tone="neutral">{t("settings.badges.session")}</StatusBadge>
              <span className="text-[13px] text-[var(--color-brown-dark)]">{t("settings.privacy.sessionText")}</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[var(--color-brown-dark)]">{title}</h2>
        {description && <p className="mt-0.5 text-[12.5px] text-[var(--color-brown)]">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
