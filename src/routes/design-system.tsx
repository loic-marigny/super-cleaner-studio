import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Search, Sparkles } from "lucide-react";
import { SpButton } from "@/components/sp/Button";
import { StatusBadge } from "@/components/sp/StatusBadge";
import { ProgressBar } from "@/components/sp/ProgressBar";
import { TextField } from "@/components/sp/TextField";
import { Toggle, Checkbox } from "@/components/sp/Toggle";
import { Stepper } from "@/components/sp/Stepper";
import { CollapsiblePanel } from "@/components/sp/CollapsiblePanel";
import { Modal } from "@/components/sp/Modal";
import { translateGlobal, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [
      { title: translateGlobal("designSystem.meta.title") },
      { name: "description", content: translateGlobal("designSystem.meta.description") },
    ],
  }),
  component: DsPage,
});

function DsPage() {
  const { t } = useI18n();
  const [modal, setModal] = useState(false);
  const [toggle, setToggle] = useState(true);
  const [check, setCheck] = useState(false);

  const swatches = [
    { name: t("designSystem.palette.background"), value: "#F4F1EA", token: "--background" },
    { name: t("designSystem.palette.surfaceRaised"), value: "#FCFBF8", token: "--surface-raised" },
    { name: t("designSystem.palette.surfaceSunken"), value: "#EDE8DE", token: "--surface-sunken" },
    { name: t("designSystem.palette.brown"), value: "#7A5C45", token: "--brown" },
    { name: t("designSystem.palette.brownDark"), value: "#4D3B2D", token: "--brown-dark" },
    { name: t("designSystem.palette.accent"), value: "#4A7CFF", token: "--accent" },
    { name: t("designSystem.palette.success"), value: "#63A86C", token: "--success" },
    { name: t("designSystem.palette.warning"), value: "#D89A3D", token: "--warning" },
    { name: t("designSystem.palette.destructive"), value: "#C85C5C", token: "--destructive" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
      <header>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">{t("designSystem.eyebrow")}</div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-brown-dark)]">{t("designSystem.title")}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--color-brown)]">{t("designSystem.description")}</p>
      </header>

      <Block title={t("designSystem.palette.title")} subtitle={t("designSystem.palette.subtitle")}>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {swatches.map((swatch) => (
            <div key={swatch.token} className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-3 shadow-panel">
              <div className="h-16 w-full rounded-md border border-[var(--color-border)]" style={{ background: swatch.value }} />
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-[var(--color-brown-dark)]">{swatch.name}</div>
                  <div className="font-mono text-[11px] text-[var(--color-brown)]">{swatch.value}</div>
                </div>
                <span className="font-mono text-[10.5px] text-[var(--color-brown)]/70">{swatch.token}</span>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title={t("designSystem.typography.title")} subtitle={t("designSystem.typography.subtitle")}>
        <div className="space-y-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-6 shadow-panel">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">{t("designSystem.typography.display")}</div>
          <div className="text-4xl font-semibold text-[var(--color-brown-dark)]">{t("designSystem.typography.hero")}</div>
          <div className="text-2xl font-semibold text-[var(--color-brown-dark)]">{t("designSystem.typography.sectionTitle")}</div>
          <div className="text-base text-[var(--color-brown-dark)]">{t("designSystem.typography.body")}</div>
          <div className="text-sm text-[var(--color-brown)]">{t("designSystem.typography.secondary")}</div>
          <div className="font-mono text-sm text-[var(--color-brown-dark)]">{t("designSystem.typography.mono")}</div>
        </div>
      </Block>

      <Block title={t("designSystem.layout.title")} subtitle={t("designSystem.layout.subtitle")}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-brown)]/70">{t("designSystem.layout.spacing")}</div>
            <div className="mt-3 flex items-end gap-1">
              {[4, 8, 12, 16, 24, 32].map((spacing) => (
                <div key={spacing} className="flex flex-col items-center gap-1">
                  <div className="rounded-sm bg-[var(--color-accent)]/80" style={{ height: spacing, width: 16 }} />
                  <span className="text-[10px] text-[var(--color-brown)]">{spacing}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-brown)]/70">{t("designSystem.layout.radius")}</div>
            <div className="mt-3 flex items-center gap-2">
              {[
                ["sm", "rounded-sm"],
                ["md", "rounded-md"],
                ["lg", "rounded-lg"],
                ["xl", "rounded-xl"],
              ].map(([label, className]) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`h-10 w-10 bg-[var(--color-brown-dark)] ${className}`} />
                  <span className="text-[10px] text-[var(--color-brown)]">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-brown)]/70">{t("designSystem.layout.shadows")}</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded-md bg-[var(--color-surface-raised)] shadow-panel" />
              <div className="h-12 w-12 rounded-md bg-[var(--color-surface-raised)] shadow-raised" />
              <div className="h-12 w-12 rounded-md bg-[var(--color-surface-raised)] shadow-floating" />
              <div className="h-12 w-12 rounded-md bg-[var(--color-surface-raised)] bevel" />
            </div>
          </div>
        </div>
      </Block>

      <Block title={t("designSystem.buttons.title")} subtitle={t("designSystem.buttons.subtitle")}>
        <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel">
          <div className="flex flex-wrap gap-2">
            <SpButton>{t("designSystem.buttons.primary")}</SpButton>
            <SpButton variant="secondary">{t("designSystem.buttons.secondary")}</SpButton>
            <SpButton variant="ghost">{t("designSystem.buttons.ghost")}</SpButton>
            <SpButton variant="accent" leadingIcon={<Sparkles className="h-4 w-4" />}>{t("designSystem.buttons.accent")}</SpButton>
            <SpButton variant="success" leadingIcon={<Download className="h-4 w-4" />}>{t("designSystem.buttons.success")}</SpButton>
            <SpButton variant="danger">{t("designSystem.buttons.danger")}</SpButton>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SpButton size="sm">{t("designSystem.buttons.small")}</SpButton>
            <SpButton size="md">{t("designSystem.buttons.medium")}</SpButton>
            <SpButton size="lg">{t("designSystem.buttons.large")}</SpButton>
            <SpButton loading>{t("designSystem.buttons.loading")}</SpButton>
            <SpButton disabled>{t("designSystem.buttons.disabled")}</SpButton>
          </div>
        </div>
      </Block>

      <Block title={t("designSystem.status.title")} subtitle={t("designSystem.status.subtitle")}>
        <div className="grid gap-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="neutral">{t("designSystem.status.neutral")}</StatusBadge>
              <StatusBadge tone="info">{t("common.severity.info")}</StatusBadge>
              <StatusBadge tone="success">{t("designSystem.status.success")}</StatusBadge>
              <StatusBadge tone="warning">{t("designSystem.status.issues")}</StatusBadge>
              <StatusBadge tone="error">{t("common.severity.error")}</StatusBadge>
              <StatusBadge tone="loading">{t("designSystem.status.loading")}</StatusBadge>
            </div>
            <Stepper
              currentIndex={2}
              steps={[
                { key: "1", label: t("designSystem.status.stepLoad") },
                { key: "2", label: t("designSystem.status.stepAnalyze") },
                { key: "3", label: t("designSystem.status.stepClean") },
                { key: "4", label: t("designSystem.status.stepExport") },
              ]}
            />
          </div>
          <div className="space-y-3">
            <ProgressBar value={38} tone="accent" label={t("designSystem.status.progressTypes")} showValue />
            <ProgressBar value={72} tone="warning" label={t("designSystem.status.progressColumns")} showValue />
            <ProgressBar value={100} tone="success" label={t("designSystem.status.progressEmpty")} showValue />
            <ProgressBar indeterminate tone="accent" label={t("designSystem.status.progressReading")} />
          </div>
        </div>
      </Block>

      <Block title={t("designSystem.forms.title")} subtitle={t("designSystem.forms.subtitle")}>
        <div className="grid gap-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel md:grid-cols-2">
          <div className="space-y-3">
            <TextField label={t("designSystem.forms.fileName")} defaultValue="export.clean" hint={t("designSystem.forms.fileNameHint")} />
            <TextField label={t("designSystem.forms.search")} placeholder={t("designSystem.forms.searchPlaceholder")} leadingIcon={<Search className="h-4 w-4" />} />
            <TextField label={t("designSystem.forms.invalidField")} defaultValue={t("designSystem.forms.invalidFieldValue")} error={t("designSystem.forms.invalidFieldError")} />
          </div>
          <div className="space-y-3">
            <Toggle checked={toggle} onChange={setToggle} label={t("designSystem.forms.autoDetect")} description={t("designSystem.forms.autoDetectDescription")} />
            <Toggle checked={false} onChange={() => {}} label={t("designSystem.forms.silentFix")} description={t("designSystem.forms.silentFixDescription")} />
            <Checkbox checked={check} onChange={setCheck} label={t("designSystem.forms.checkbox")} />
          </div>
        </div>
      </Block>

      <Block title={t("designSystem.panels.title")} subtitle={t("designSystem.panels.subtitle")}>
        <div className="space-y-3">
          <CollapsiblePanel
            title={t("designSystem.panels.cleanupTitle")}
            subtitle={t("designSystem.panels.cleanupSubtitle")}
            defaultOpen
            action={<SpButton size="sm" variant="accent">{t("designSystem.panels.apply")}</SpButton>}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle checked={true} onChange={() => {}} label={t("designSystem.panels.normalizeCase")} />
              <Toggle checked={true} onChange={() => {}} label={t("designSystem.panels.trimSpaces")} />
              <Toggle checked={false} onChange={() => {}} label={t("designSystem.panels.detectDuplicates")} />
              <Toggle checked={false} onChange={() => {}} label={t("designSystem.panels.detectOutliers")} />
            </div>
          </CollapsiblePanel>
          <div>
            <SpButton onClick={() => setModal(true)}>{t("designSystem.panels.openModal")}</SpButton>
          </div>
        </div>
      </Block>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={t("designSystem.panels.modalTitle")}
        description={t("designSystem.panels.modalDescription")}
        footer={
          <>
            <SpButton variant="ghost" onClick={() => setModal(false)}>{t("common.actions.cancel")}</SpButton>
            <SpButton onClick={() => setModal(false)}>{t("designSystem.panels.confirm")}</SpButton>
          </>
        }
      >
        <p className="text-sm text-[var(--color-brown)]">{t("designSystem.panels.modalBody")}</p>
      </Modal>
    </div>
  );
}

function Block({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-brown-dark)]">{title}</h2>
          {subtitle ? <p className="text-[12.5px] text-[var(--color-brown)]">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
