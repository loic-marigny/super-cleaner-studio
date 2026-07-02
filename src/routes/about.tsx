import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/sp/Logo";
import { Github, Mail, ShieldCheck, EyeOff, Feather, Cpu } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Super Pipeline" },
      { name: "description", content: "L'histoire, la philosophie et la licence de Super Pipeline." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <div className="flex items-center justify-between">
        <Logo size="lg" />
        <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-brown)]/70">v0.1 · MIT</span>
      </div>

      <h1 className="mt-8 text-3xl font-semibold text-[var(--color-brown-dark)]">
        Un petit utilitaire, rien de plus.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-brown)]">
        Super Pipeline est né d'une idée simple : nettoyer un fichier Excel ne devrait pas exiger de
        créer un compte, d'installer un logiciel, ni d'envoyer ses données sur un serveur. Ouvrez, corrigez,
        exportez. C'est tout.
      </p>

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        <Value icon={<ShieldCheck className="h-4 w-4" />} title="Confiance">
          Aucun compte, aucun cookie de suivi, aucune télémétrie.
        </Value>
        <Value icon={<EyeOff className="h-4 w-4" />} title="Confidentialité">
          Les fichiers sont traités uniquement dans votre navigateur.
        </Value>
        <Value icon={<Feather className="h-4 w-4" />} title="Sobriété">
          Une interface calme, sans notifications inutiles ni gamification.
        </Value>
        <Value icon={<Cpu className="h-4 w-4" />} title="Local d'abord">
          Aucune connexion serveur requise pour utiliser l'outil.
        </Value>
      </section>

      <section className="mt-10 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 shadow-panel">
        <h2 className="text-base font-semibold text-[var(--color-brown-dark)]">Licence</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-brown)]">
          Super Pipeline est distribué sous licence <span className="font-medium">MIT</span>. Vous
          êtes libre de l'utiliser, de le modifier et de le redistribuer, y compris pour un usage
          commercial.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-[13px]">
          <a
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 hover:bg-[var(--color-secondary)]"
            href="#"
          >
            <Github className="h-4 w-4" /> Code source
          </a>
          <a
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 hover:bg-[var(--color-secondary)]"
            href="#"
          >
            <Mail className="h-4 w-4" /> Nous écrire
          </a>
        </div>
      </section>

      <p className="mt-10 text-center text-[12px] text-[var(--color-brown)]/70">
        Fait avec soin, comme un outil qu'on aime avoir sur son bureau.
      </p>
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
