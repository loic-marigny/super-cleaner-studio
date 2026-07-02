import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileDrop } from "@/components/sp/FileDrop";
import { Logo } from "@/components/sp/Logo";
import { ShieldCheck, EyeOff, Zap, FileText, ArrowRight } from "lucide-react";
import { SpButton } from "@/components/sp/Button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Super Pipeline — Nettoyer vos fichiers Excel et CSV" },
      {
        name: "description",
        content:
          "Déposez un fichier .xlsx ou .csv, laissez Super Pipeline détecter les problèmes et téléchargez un fichier propre. Local, gratuit, sans compte.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex-1">
      {/* Discreet backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[var(--color-surface-raised)] to-transparent" />

      <div className="relative mx-auto max-w-5xl px-6 pt-16 pb-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3 py-1 text-[11px] font-medium text-[var(--color-brown)] bevel">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            Traitement 100% local · Aucun envoi de fichier
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--color-brown-dark)]">
            Nettoyez vos fichiers Excel et CSV.
            <br />
            <span className="text-[var(--color-brown)]">Sans compte. Sans détour.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-brown)]">
            Super Pipeline est un petit utilitaire de bureau qui vit dans votre navigateur.
            Déposez un fichier, laissez-le être analysé, choisissez ce que vous voulez corriger,
            puis téléchargez un fichier propre. Rien de plus.
          </p>
        </div>

        <div className="mt-10">
          <FileDrop onFile={() => navigate({ to: "/workspace" })} />
        </div>

        {/* Three-step explanation */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <StepCard n={1} title="Déposez un fichier" text=".xlsx, .csv ou .tsv. Il ne quitte jamais votre machine." />
          <StepCard n={2} title="Analyse automatique" text="Types, valeurs manquantes, incohérences, valeurs aberrantes." />
          <StepCard n={3} title="Téléchargez le résultat" text="Un fichier propre, standardisé, prêt à être utilisé." />
        </div>

        {/* Trust row */}
        <div className="mt-12 grid gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]/70 p-4 sm:grid-cols-3">
          <TrustItem icon={<ShieldCheck className="h-4 w-4" />} label="Aucun compte" text="Rien à créer, rien à confirmer." />
          <TrustItem icon={<EyeOff className="h-4 w-4" />} label="Aucun stockage" text="Vos fichiers restent dans votre navigateur." />
          <TrustItem icon={<Zap className="h-4 w-4" />} label="Rapide et local" text="Aucun serveur à contacter, aucune attente." />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <SpButton variant="secondary" onClick={() => navigate({ to: "/workspace" })} trailingIcon={<ArrowRight className="h-4 w-4" />}>
            Ouvrir un fichier d'exemple
          </SpButton>
          <SpButton variant="ghost" onClick={() => navigate({ to: "/about" })} leadingIcon={<FileText className="h-4 w-4" />}>
            En savoir plus sur le projet
          </SpButton>
        </div>

        <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6 text-[12px] text-[var(--color-brown)]/80">
          <Logo size="sm" showWordmark />
          <div className="flex items-center gap-4">
            <span>Version 0.1 · Licence MIT</span>
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
        <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-brown-dark)] text-[var(--color-surface-raised)] text-[11px] font-bold bevel">
          {n}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-brown-dark)]">{title}</h3>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-brown)]">{text}</p>
    </div>
  );
}

function TrustItem({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5 px-2 py-1">
      <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-md bg-[var(--color-secondary)] text-[var(--color-brown-dark)]">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-[var(--color-brown-dark)]">{label}</div>
        <div className="text-[12px] text-[var(--color-brown)]">{text}</div>
      </div>
    </div>
  );
}
