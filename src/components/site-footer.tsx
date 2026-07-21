import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto space-y-3 px-4 text-center text-sm text-muted-foreground">
        <Link href="/" className="inline-flex justify-center">
          <BrandLogo imageClassName="h-7" />
        </Link>
        <p>
          <a href="https://github.com/gd-moarph/Retrase" target="_blank" rel="noreferrer" className="hover:underline">Open source (AGPL-3.0)</a>{" "}
          &middot;{" "}
          <Link href="/disclaimer" className="hover:underline">
            Disclaimer
          </Link>{" "}
          &middot;{" "}
          <Link href="/confidentialitate" className="hover:underline">
            Confidențialitate
          </Link>{" "}
          &middot;{" "}
          <Link href="/termeni" className="hover:underline">
            Termeni
          </Link>
        </p>
        <p>
          2026 © Retrase.ro — Acces public și gratuit la date oficiale - Proiect construit de catre Gabriel Dumitru /{" "}
          <a href="mailto:dumitruninelgabriel@gmail.com" className="hover:underline">
            Contact
          </a>
        </p>
      </div>
    </footer>
  );
}
