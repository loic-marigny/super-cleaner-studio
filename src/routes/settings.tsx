import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toggle } from "@/components/sp/Toggle";
import { TextField } from "@/components/sp/TextField";
import { SpButton } from "@/components/sp/Button";
import { StatusBadge } from "@/components/sp/StatusBadge";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — Super Pipeline" },
      { name: "description", content: "Ajustez le thème, le séparateur CSV, les formats de date et vos préférences d'affichage." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(false);
  const [compact, setCompact] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--color-brown-dark)]">Paramètres</h1>
        <p className="mt-1 text-sm text-[var(--color-brown)]">
          Ces préférences sont enregistrées uniquement dans ce navigateur.
        </p>
      </header>

      <div className="space-y-4">
        <Section title="Apparence" description="Adaptez le thème à votre confort.">
          <Toggle checked={dark} onChange={setDark} label="Thème sombre" description="Bascule automatique la nuit désactivée." />
          <Toggle checked={compact} onChange={setCompact} label="Mode compact" description="Réduit les hauteurs de lignes du tableur." />
        </Section>

        <Section title="Import CSV" description="Réglages appliqués à la lecture des fichiers CSV.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[12.5px] font-medium text-[var(--color-brown-dark)]">Séparateur</div>
              <div className="flex gap-2">
                {[",", ";", "\\t", "|"].map((s, i) => (
                  <label
                    key={s}
                    className="flex-1 cursor-pointer rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-center text-[13px] font-medium hover:bg-[var(--color-secondary)] has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface-raised))]"
                  >
                    <input type="radio" name="sep" defaultChecked={i === 0} className="sr-only" />
                    {s === "\\t" ? "Tab" : s}
                  </label>
                ))}
              </div>
            </div>
            <TextField label="Marqueur de texte" defaultValue={'"'} hint="Caractère entourant les chaînes." />
          </div>
        </Section>

        <Section title="Formats" description="Comment interpréter et exporter les données typées.">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Format de date" defaultValue="AAAA-MM-JJ" hint="ISO 8601 recommandé." />
            <TextField label="Séparateur décimal" defaultValue="," />
          </div>
        </Section>

        <Section title="Analyse" description="Comportements par défaut lors de l'ouverture d'un fichier.">
          <Toggle checked={autoDetect} onChange={setAutoDetect} label="Détecter automatiquement les types" />
          <Toggle checked={true} onChange={() => {}} label="Signaler les valeurs aberrantes" />
          <Toggle checked={false} onChange={() => {}} label="Ouvrir automatiquement les problèmes détectés" />
        </Section>

        <Section title="Confidentialité" description="Super Pipeline ne stocke aucun fichier. Seules les préférences ci-dessus persistent.">
          <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <div className="flex items-center gap-2">
              <StatusBadge tone="success">Local</StatusBadge>
              <span className="text-[13px] text-[var(--color-brown-dark)]">2 préférences enregistrées dans ce navigateur.</span>
            </div>
            <SpButton variant="ghost" size="sm" leadingIcon={<Trash2 className="h-4 w-4" />}>
              Tout effacer
            </SpButton>
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
