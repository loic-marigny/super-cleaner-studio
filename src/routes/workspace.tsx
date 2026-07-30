import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Spreadsheet, mockData } from "@/components/sp/Spreadsheet";
import { SpButton } from "@/components/sp/Button";
import { StatusBadge } from "@/components/sp/StatusBadge";
import { Stepper } from "@/components/sp/Stepper";
import { ProgressBar } from "@/components/sp/ProgressBar";
import { CollapsiblePanel } from "@/components/sp/CollapsiblePanel";
import { Modal } from "@/components/sp/Modal";
import { Toggle } from "@/components/sp/Toggle";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Filter,
  Play,
  RotateCcw,
  Search,
  Undo2,
  Wand2,
  Save,
  Rows3,
} from "lucide-react";
import { TextField } from "@/components/sp/TextField";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Super Pipeline" },
      { name: "description", content: "Analysez, nettoyez et exportez votre fichier depuis le workspace de Super Pipeline." },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const data = useMemo(() => mockData(120), []);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const totalIssues = data.columns.reduce((s, c) => s + c.issues, 0);
  const totalNulls = data.columns.reduce((s, c) => s + c.nulls, 0);
  const avgProgress = Math.round(data.columns.reduce((s, c) => s + c.progress, 0) / data.columns.length);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Toolbar */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/80 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--color-secondary)] text-[var(--color-brown-dark)] bevel">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[var(--color-brown-dark)]">
                  clients_2024_export.xlsx
                </div>
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-[var(--color-brown)]">
                  <span className="truncate tabular-nums">{data.rows.length} lignes · {data.columns.length} colonnes</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">418 Ko</span>
                </div>
              </div>
            </div>
            <div className="mx-2 hidden h-6 w-px shrink-0 bg-[var(--color-border)] md:block" />
            <div className="hidden min-w-0 md:block">
              <Stepper
                currentIndex={1}
                steps={[
                  { key: "load", label: "Lecture" },
                  { key: "analyze", label: "Analyse" },
                  { key: "clean", label: "Nettoyage" },
                  { key: "export", label: "Export" },
                ]}
              />
            </div>
          </div>


          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="hidden xl:flex items-center gap-2">
              <StatusBadge tone={totalIssues > 0 ? "warning" : "success"}>
                {totalIssues} problème{totalIssues > 1 ? "s" : ""}
              </StatusBadge>
              <StatusBadge tone="neutral">{totalNulls} valeurs vides</StatusBadge>
            </div>
            <SpButton variant="ghost" size="sm" leadingIcon={<Undo2 className="h-4 w-4" />}>
              Annuler
            </SpButton>
            <SpButton
              variant="secondary"
              size="sm"
              leadingIcon={<AlertTriangle className="h-4 w-4" />}
              onClick={() => setIssuesOpen(true)}
              title="Problèmes détectés"
            >
              <span className="hidden lg:inline">Problèmes détectés</span>
              <span className="lg:hidden">Problèmes</span>
              <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-warning)] px-1 text-[10px] font-bold text-[var(--color-warning-foreground)]">
                {totalIssues}
              </span>
            </SpButton>

            <SpButton
              variant="primary"
              size="sm"
              leadingIcon={<Download className="h-4 w-4" />}
              onClick={() => setDownloadOpen(true)}
            >
              Exporter
            </SpButton>
          </div>
        </div>

        {/* Secondary bar */}
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] px-4 py-1.5 sm:px-5">
          <div className="flex items-center gap-1">
            <SpButton size="icon" variant="ghost" title="Rechercher"><Search className="h-4 w-4" /></SpButton>
            <SpButton size="icon" variant="ghost" title="Filtrer"><Filter className="h-4 w-4" /></SpButton>
            <SpButton size="icon" variant="ghost" title="Réorganiser"><Rows3 className="h-4 w-4" /></SpButton>
            <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />
            <SpButton size="icon" variant="ghost" title="Nettoyage rapide"><Wand2 className="h-4 w-4" /></SpButton>
            <SpButton size="icon" variant="ghost" title="Rejouer"><RotateCcw className="h-4 w-4" /></SpButton>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex min-w-0 items-center gap-3">
            <span className="hidden text-[11px] text-[var(--color-brown)] lg:inline">Progression globale</span>
            <ProgressBar
              value={avgProgress}
              size="xs"
              tone={avgProgress >= 100 ? "success" : "accent"}
              className="w-24 lg:w-40"
              showValue
            />
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="min-h-0 flex-1 h-[clamp(240px,52vh,640px)]">
          <Spreadsheet columns={data.columns} rows={data.rows} />
        </div>

        {/* Rules — collapsible, closed by default */}

        <CollapsiblePanel
          title="Règles de nettoyage"
          subtitle="Choisissez les comportements à appliquer à l'ensemble du fichier."
          action={
            <SpButton size="sm" variant="accent" leadingIcon={<Play className="h-3.5 w-3.5" />}>
              Appliquer
            </SpButton>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RuleGroup title="Types de données">
              <Toggle checked={true} onChange={() => {}} label="Détecter automatiquement les types" description="Nombre, date, email, texte." />
              <Toggle checked={true} onChange={() => {}} label="Corriger les erreurs de type" description="Convertit ou signale les cellules incompatibles." />
              <Toggle checked={false} onChange={() => {}} label="Standardiser les formats de date" description="ISO 8601 par défaut." />
            </RuleGroup>
            <RuleGroup title="Valeurs manquantes">
              <Toggle checked={true} onChange={() => {}} label="Marquer les cellules vides" />
              <Toggle checked={false} onChange={() => {}} label="Supprimer les lignes entièrement vides" />
              <Toggle checked={false} onChange={() => {}} label="Remplacer par une valeur par défaut" />
            </RuleGroup>
            <RuleGroup title="Cohérence">
              <Toggle checked={true} onChange={() => {}} label="Uniformiser la casse" description="Ex. capitalisation des noms." />
              <Toggle checked={true} onChange={() => {}} label="Nettoyer les espaces superflus" />
              <Toggle checked={false} onChange={() => {}} label="Détecter les doublons" />
              <Toggle checked={false} onChange={() => {}} label="Isoler les valeurs aberrantes" />
            </RuleGroup>
          </div>
        </CollapsiblePanel>
      </div>

      {/* Issues modal */}
      <Modal
        open={issuesOpen}
        onClose={() => setIssuesOpen(false)}
        title="Problèmes détectés"
        description="Passez en revue les colonnes ayant des anomalies. Choisissez ce que vous voulez corriger."
        size="lg"
        footer={
          <>
            <SpButton variant="ghost" onClick={() => setIssuesOpen(false)}>Fermer</SpButton>
            <SpButton variant="primary" leadingIcon={<Wand2 className="h-4 w-4" />}>
              Appliquer les corrections sélectionnées
            </SpButton>
          </>
        }
      >
        <ul className="divide-y divide-[var(--color-border)]">
          {data.columns
            .filter((c) => c.issues > 0 || c.nulls > 0)
            .map((c) => (
              <li key={c.key} className="flex items-start gap-3 py-3">
                <div className="mt-0.5">
                  <StatusBadge tone={c.issues > 0 ? "warning" : "info"}>
                    {c.issues > 0 ? `${c.issues} anomalies` : `${c.nulls} vides`}
                  </StatusBadge>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--color-brown-dark)]">{c.name}</div>
                  <div className="mt-0.5 text-[12px] text-[var(--color-brown)]">
                    {c.issues > 0
                      ? "Valeurs invalides détectées pour ce type de colonne."
                      : "Cellules vides ou non renseignées."}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SpButton size="sm" variant="ghost">Ignorer</SpButton>
                  <SpButton size="sm" variant="secondary">Corriger</SpButton>
                </div>
              </li>
            ))}
        </ul>
      </Modal>

      {/* Download modal */}
      <Modal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        title="Exporter le fichier nettoyé"
        description="Aucun fichier n'est envoyé. L'export est généré localement."
        footer={
          <>
            <SpButton variant="ghost" onClick={() => setDownloadOpen(false)}>Annuler</SpButton>
            <SpButton variant="success" leadingIcon={<Save className="h-4 w-4" />}>Télécharger</SpButton>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Nom du fichier" defaultValue="clients_2024_export.clean" hint="L'extension est ajoutée automatiquement." />
          <div>
            <div className="mb-1 text-[12.5px] font-medium text-[var(--color-brown-dark)]">Format</div>
            <div className="grid grid-cols-3 gap-2">
              {["xlsx", "csv", "tsv"].map((f, i) => (
                <label
                  key={f}
                  className="cursor-pointer rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3 py-2 text-center text-[13px] font-medium text-[var(--color-brown-dark)] hover:bg-[var(--color-secondary)] has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface-raised))]"
                >
                  <input type="radio" name="fmt" defaultChecked={i === 0} className="sr-only" />
                  .{f}
                </label>
              ))}
            </div>
          </div>
          <Toggle checked={true} onChange={() => {}} label="Inclure une ligne d'en-tête" />
          <Toggle checked={false} onChange={() => {}} label="Inclure une seconde feuille avec le rapport d'analyse" />
        </div>
      </Modal>
    </div>
  );
}

function RuleGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brown)]/80">
        {title}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
