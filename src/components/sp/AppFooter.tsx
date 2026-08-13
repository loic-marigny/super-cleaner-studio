import { Globe, Github, Linkedin } from "lucide-react";

const externalLinks = [
  {
    label: "GitHub",
    href: "https://github.com/loic-marigny",
    icon: Github,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/loic-marigny/",
    icon: Linkedin,
  },
  {
    label: "loic-marigny.com",
    href: "https://loic-marigny.com/",
    icon: Globe,
  },
] as const;

export function AppFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/85">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-[12px] text-[var(--color-brown)]/80">
        <div className="font-mono uppercase tracking-[0.14em]">Loic Marigny</div>
        <div className="flex flex-wrap items-center gap-2">
          {externalLinks.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12px] text-[var(--color-brown-dark)] transition-colors hover:bg-[var(--color-secondary)]"
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
