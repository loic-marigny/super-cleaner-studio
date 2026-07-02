import { createFileRoute } from "@tanstack/react-router";
import { SpButton } from "@/components/sp/Button";
import { StatusBadge } from "@/components/sp/StatusBadge";
import { ProgressBar } from "@/components/sp/ProgressBar";
import { TextField } from "@/components/sp/TextField";
import { Toggle, Checkbox } from "@/components/sp/Toggle";
import { Stepper } from "@/components/sp/Stepper";
import { CollapsiblePanel } from "@/components/sp/CollapsiblePanel";
import { Modal } from "@/components/sp/Modal";
import { useState } from "react";
import { Download, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [
      { title: "Design system — Super Pipeline" },
      { name: "description", content: "Palette, typographie, composants et animations du design system Super Pipeline." },
    ],
  }),
  component: DsPage,
});

const swatches = [
  { name: "Fond principal", value: "#F4F1EA", token: "--background" },
  { name: "Fond secondaire", value: "#FCFBF8", token: "--surface-raised" },
  { name: "Fond enfoncé", value: "#EDE8DE", token: "--surface-sunken" },
  { name: "Brun principal", value: "#7A5C45", token: "--brown" },
  { name: "Brun foncé", value: "#4D3B2D", token: "--brown-dark" },
  { name: "Bleu accent", value: "#4A7CFF", token: "--accent" },
  { name: "Vert succès", value: "#63A86C", token: "--success" },
  { name: "Orange avertissement", value: "#D89A3D", token: "--warning" },
  { name: "Rouge erreur", value: "#C85C5C", token: "--destructive" },
];

function DsPage() {
  const [modal, setModal] = useState(false);
  const [toggle, setToggle] = useState(true);
  const [check, setCheck] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-12">
      <header>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">Design system</div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-brown-dark)]">Fondations de Super Pipeline</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--color-brown)]">
          Une base cohérente inspirée des logiciels bureautiques 1995–2005, entièrement modernisée.
          Chaleureuse, sobre, très lisible.
        </p>
      </header>

      {/* Palette */}
      <Block title="Palette" subtitle="Toutes les couleurs sont exposées comme variables CSS.">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {swatches.map((s) => (
            <div key={s.token} className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-3 shadow-panel">
              <div className="h-16 w-full rounded-md border border-[var(--color-border)]" style={{ background: s.value }} />
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-[var(--color-brown-dark)]">{s.name}</div>
                  <div className="font-mono text-[11px] text-[var(--color-brown)]">{s.value}</div>
                </div>
                <span className="font-mono text-[10.5px] text-[var(--color-brown)]/70">{s.token}</span>
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* Typography */}
      <Block title="Typographie" subtitle="Inter pour l'UI. JetBrains Mono pour les données et le monogramme.">
        <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-6 shadow-panel space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">Display · Semibold</div>
          <div className="text-4xl font-semibold text-[var(--color-brown-dark)]">Nettoyer sans détour.</div>
          <div className="text-2xl font-semibold text-[var(--color-brown-dark)]">Titre de section</div>
          <div className="text-base text-[var(--color-brown-dark)]">Corps de texte, taille par défaut. Le brun foncé garde du confort de lecture sans agresser.</div>
          <div className="text-sm text-[var(--color-brown)]">Texte secondaire. Notes, descriptions, sous-titres.</div>
          <div className="font-mono text-sm text-[var(--color-brown-dark)]">clients_2024_export.xlsx · 12 450,00 €</div>
        </div>
      </Block>

      {/* Grid, spacing, radius, shadow */}
      <Block title="Grille, espacement, rayons, ombres" subtitle="Multiples de 8 px. Rayons doux. Ombres très légères.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-brown)]/70">Espacements</div>
            <div className="mt-3 flex items-end gap-1">
              {[4, 8, 12, 16, 24, 32].map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div className="bg-[var(--color-accent)]/80 rounded-sm" style={{ height: s, width: 16 }} />
                  <span className="text-[10px] text-[var(--color-brown)]">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-brown)]/70">Rayons</div>
            <div className="mt-3 flex items-center gap-2">
              {[
                ["sm", "rounded-sm"],
                ["md", "rounded-md"],
                ["lg", "rounded-lg"],
                ["xl", "rounded-xl"],
              ].map(([l, c]) => (
                <div key={l} className="flex flex-col items-center gap-1">
                  <div className={`h-10 w-10 bg-[var(--color-brown-dark)] ${c}`} />
                  <span className="text-[10px] text-[var(--color-brown)]">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-4 shadow-panel">
            <div className="text-[11px] uppercase tracking-wider text-[var(--color-brown)]/70">Ombres</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded-md bg-[var(--color-surface-raised)] shadow-panel" />
              <div className="h-12 w-12 rounded-md bg-[var(--color-surface-raised)] shadow-raised" />
              <div className="h-12 w-12 rounded-md bg-[var(--color-surface-raised)] shadow-floating" />
              <div className="h-12 w-12 rounded-md bg-[var(--color-surface-raised)] bevel" />
            </div>
          </div>
        </div>
      </Block>

      {/* Buttons */}
      <Block title="Boutons" subtitle="Six variantes, quatre tailles, tous les états.">
        <div className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel">
          <div className="flex flex-wrap gap-2">
            <SpButton>Primaire</SpButton>
            <SpButton variant="secondary">Secondaire</SpButton>
            <SpButton variant="ghost">Discret</SpButton>
            <SpButton variant="accent" leadingIcon={<Sparkles className="h-4 w-4" />}>Accent</SpButton>
            <SpButton variant="success" leadingIcon={<Download className="h-4 w-4" />}>Succès</SpButton>
            <SpButton variant="danger">Erreur</SpButton>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SpButton size="sm">Small</SpButton>
            <SpButton size="md">Medium</SpButton>
            <SpButton size="lg">Large</SpButton>
            <SpButton loading>En cours</SpButton>
            <SpButton disabled>Désactivé</SpButton>
          </div>
        </div>
      </Block>

      {/* Status */}
      <Block title="Statuts & progression" subtitle="Signaux courts et barres discrètes.">
        <div className="grid gap-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="neutral">Neutre</StatusBadge>
              <StatusBadge tone="info">Info</StatusBadge>
              <StatusBadge tone="success">Terminé</StatusBadge>
              <StatusBadge tone="warning">3 anomalies</StatusBadge>
              <StatusBadge tone="error">Échec</StatusBadge>
              <StatusBadge tone="loading">Analyse…</StatusBadge>
            </div>
            <Stepper
              currentIndex={2}
              steps={[
                { key: "1", label: "Lecture" },
                { key: "2", label: "Analyse" },
                { key: "3", label: "Nettoyage" },
                { key: "4", label: "Export" },
              ]}
            />
          </div>
          <div className="space-y-3">
            <ProgressBar value={38} tone="accent" label="Analyse des types" showValue />
            <ProgressBar value={72} tone="warning" label="Cohérence des colonnes" showValue />
            <ProgressBar value={100} tone="success" label="Cellules vides" showValue />
            <ProgressBar indeterminate tone="accent" label="Lecture du fichier…" />
          </div>
        </div>
      </Block>

      {/* Forms */}
      <Block title="Formulaires" subtitle="Champs, sélecteurs, interrupteurs.">
        <div className="grid gap-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel md:grid-cols-2">
          <div className="space-y-3">
            <TextField label="Nom du fichier" defaultValue="export.clean" hint="L'extension est ajoutée automatiquement." />
            <TextField label="Recherche" placeholder="Chercher une colonne…" leadingIcon={<Search className="h-4 w-4" />} />
            <TextField label="Champ en erreur" defaultValue="mauvaise valeur" error="Ce champ est invalide." />
          </div>
          <div className="space-y-3">
            <Toggle checked={toggle} onChange={setToggle} label="Détecter automatiquement les types" description="Nombre, date, email, texte." />
            <Toggle checked={false} onChange={() => {}} label="Corriger silencieusement" description="Applique les corrections sans confirmation." />
            <Checkbox checked={check} onChange={setCheck} label="J'ai compris que rien n'est envoyé sur un serveur." />
          </div>
        </div>
      </Block>

      {/* Panels & overlays */}
      <Block title="Panneaux et fenêtres" subtitle="Panneau repliable, modal centrée.">
        <div className="space-y-3">
          <CollapsiblePanel
            title="Règles de nettoyage"
            subtitle="Fermé par défaut. Ne prend pas de place tant qu'il n'est pas ouvert."
            defaultOpen
            action={<SpButton size="sm" variant="accent">Appliquer</SpButton>}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle checked={true} onChange={() => {}} label="Uniformiser la casse" />
              <Toggle checked={true} onChange={() => {}} label="Nettoyer les espaces" />
              <Toggle checked={false} onChange={() => {}} label="Détecter les doublons" />
              <Toggle checked={false} onChange={() => {}} label="Isoler les valeurs aberrantes" />
            </div>
          </CollapsiblePanel>
          <div>
            <SpButton onClick={() => setModal(true)}>Ouvrir une fenêtre modale</SpButton>
          </div>
        </div>
      </Block>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Exemple de fenêtre"
        description="Ouvre par-dessus le tableur, se referme en un clic."
        footer={
          <>
            <SpButton variant="ghost" onClick={() => setModal(false)}>Annuler</SpButton>
            <SpButton onClick={() => setModal(false)}>Confirmer</SpButton>
          </>
        }
      >
        <p className="text-sm text-[var(--color-brown)]">
          Les fenêtres modales servent à la gestion ponctuelle — problèmes détectés, export, préférences avancées.
          Une fois refermées, l'espace de travail retrouve toute la place.
        </p>
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
          {subtitle && <p className="text-[12.5px] text-[var(--color-brown)]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
