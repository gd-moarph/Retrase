import Link from "next/link";
import { Code2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" aria-label="Retrase.ro"><BrandLogo imageClassName="h-8" /></Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <Link href="/medicamente" className="text-muted-foreground hover:text-foreground">Medicamente</Link>
          <Link href="/produse-generale" className="text-muted-foreground hover:text-foreground">Produse retrase</Link>
          <Link href="/surse-date" className="text-muted-foreground hover:text-foreground">Surse și stare</Link>
          <a className={buttonVariants({ size: "sm", variant: "outline" })} href="https://github.com/gd-moarph/Retrase" target="_blank" rel="noreferrer"><Code2 className="mr-2 h-4 w-4" />Cod sursă</a>
        </nav>
      </div>
    </header>
  );
}
