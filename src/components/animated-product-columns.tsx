"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, Pill, ShoppingCart } from "lucide-react";
import { ProductRecallDialog } from "@/components/product-recall-dialog";

interface MedicineItem {
  id: string;
  commercialName: string;
  authorizationHolder: string | null;
  notificationType: string | null;
  addressDate: string | null;
}

interface RecallItem {
  id: string;
  productName: string | null;
  title: string | null;
  brand: string | null;
  retailer: string | null;
  reason: string | null;
  publishedAt: string | null;
  imageUrls: string[];
  officialPdfDocumentId: string | null;
  category: string | null;
  consumerInstruction: string | null;
  refundInstruction: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  quantity: string | null;
  lotNumber: string | null;
  barcode: string | null;
  riskType: string | null;
  sourceUrl: string | null;
}

function formatRecallDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" }) : "-";
}

function FeedPanel({
  icon,
  title,
  description,
  href,
  cta,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b bg-muted/30 px-5 py-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="divide-y">{children}</div>
      <div className="border-t bg-muted/20 px-5 py-3">
        <Button render={<Link href={href} />} variant="ghost" size="sm" className="-ml-3 gap-1 text-primary">
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function AnimatedProductColumns() {
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [recalls, setRecalls] = useState<RecallItem[]>([]);
  const [dialogRecall, setDialogRecall] = useState<RecallItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch("/api/ultimele-produse")
      .then((response) => {
        if (!response.ok) throw new Error("Actualizările recente nu sunt disponibile");
        return response.json();
      })
      .then((data) => {
        setMedicines(data.medicines || []);
        setRecalls(data.recalls || []);
      })
      .catch(() => {});
  }, []);

  if (medicines.length === 0 && recalls.length === 0) return null;

  return (
    <section className="border-y bg-muted/20 py-14 md:py-16">
      <ProductRecallDialog recall={dialogRecall} open={dialogOpen} onOpenChange={setDialogOpen} />

      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3">
            Surse oficiale
          </Badge>
          <h2 className="text-2xl font-bold md:text-3xl">Actualizări recente</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
            Cele mai noi publicări ANMDMR și ANSVSA, grupate pentru verificare rapidă.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <FeedPanel
            icon={<Pill className="h-5 w-5" />}
            title="Medicamente"
            description="Discontinuități și notificări publicate de ANMDMR."
            href="/medicamente"
            cta="Vezi medicamentele"
          >
            {medicines.map((item, index) => (
              <div
                key={item.id}
                className="group px-5 py-4 transition-colors hover:bg-muted/30"
                style={{ animation: `fadeInUp 0.35s ease-out ${index * 0.06}s both` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium leading-5">{item.commercialName}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      Deținător: {item.authorizationHolder || "-"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.addressDate || "-"}</span>
                </div>
                <Badge variant="secondary" className="mt-3 max-w-full truncate font-normal">
                  {item.notificationType || "Notificare"}
                </Badge>
              </div>
            ))}
          </FeedPanel>

          <FeedPanel
            icon={<ShoppingCart className="h-5 w-5" />}
            title="Produse generale"
            description="Retrageri și rechemări publicate de ANSVSA."
            href="/produse-generale"
            cta="Vezi produsele"
          >
            <TooltipProvider>
              {recalls.map((item, index) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger
                    render={<button type="button" />}
                    className="group block w-full px-5 py-4 text-left transition-colors hover:bg-muted/30"
                    onClick={() => {
                      setDialogRecall(item);
                      setDialogOpen(true);
                    }}
                    style={{ animation: `fadeInUp 0.35s ease-out ${index * 0.06}s both` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium leading-5">{item.productName || item.title}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {[item.brand, item.retailer].filter(Boolean).join(" / ") || "-"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRecallDate(item.publishedAt)}</span>
                    </div>
                    <p className="mt-3 line-clamp-1 text-xs text-muted-foreground">{item.reason || "Detalii în documentul oficial"}</p>
                  </TooltipTrigger>
                  {item.imageUrls?.[0] && (
                    <TooltipContent side="right" className="p-2">
                      <img
                        src={`/api/produse-generale/${item.id}/image`}
                        alt={item.productName || ""}
                        className="h-48 w-48 rounded object-cover"
                      />
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </TooltipProvider>
          </FeedPanel>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
