"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Mail,
  Package,
  Phone,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

interface RecallData {
  id: string;
  title: string | null;
  productName: string | null;
  brand: string | null;
  retailer: string | null;
  category: string | null;
  reason: string | null;
  lotNumber: string | null;
  barcode: string | null;
  riskType: string | null;
  consumerInstruction: string | null;
  refundInstruction: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  quantity: string | null;
  publishedAt: string | null;
  sourceUrl: string | null;
  imageUrls: string[];
  officialPdfDocumentId: string | null;
}

interface Props {
  recall: RecallData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetailItem {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  warning?: boolean;
}

export function ProductRecallDialog({ recall, open, onOpenChange }: Props) {
  if (!recall) return null;

  const localPdfUrl = recall.officialPdfDocumentId
    ? `/api/produse-generale/${recall.id}/pdf`
    : null;
  const officialPdfUrl = recall.sourceUrl?.toLowerCase().includes(".pdf")
    ? recall.sourceUrl
    : null;
  const displayPdfUrl = localPdfUrl || officialPdfUrl;
  const title = recall.productName || recall.title || "Produs retras";
  const subtitle = [recall.brand, recall.retailer].filter(Boolean).join(" - ");
  const detailItems: DetailItem[] = [];
  const pushDetail = (item: DetailItem | null) => {
    if (item) detailItems.push(item);
  };

  pushDetail(recall.productName ? { icon: Package, label: "Produs", value: recall.productName } : null);
  pushDetail(recall.brand ? { icon: Building2, label: "Brand", value: recall.brand } : null);
  pushDetail(recall.retailer ? { icon: ShoppingCart, label: "Retailer", value: recall.retailer } : null);
  pushDetail(recall.category ? { icon: Hash, label: "Categorie", value: categoryBadge(recall.category) } : null);
  pushDetail(recall.reason ? { icon: AlertTriangle, label: "Motiv", value: recall.reason, warning: true } : null);
  pushDetail(recall.lotNumber ? { icon: Hash, label: "Lot / valabilitate", value: recall.lotNumber } : null);
  pushDetail(recall.quantity ? { icon: Package, label: "Cantitate", value: recall.quantity } : null);
  pushDetail(recall.publishedAt ? {
    icon: Calendar,
    label: "Data publicare",
    value: new Date(recall.publishedAt).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" }),
  } : null);
  pushDetail(recall.contactPhone ? { icon: Phone, label: "Telefon", value: recall.contactPhone } : null);
  pushDetail(recall.contactEmail ? { icon: Mail, label: "Email", value: recall.contactEmail } : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[94dvh] max-h-[94dvh] w-[calc(100vw-1rem)] max-w-[1280px] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-[1280px]">
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr]">
          <DialogHeader className="border-b bg-popover px-4 py-3 pr-12 sm:px-5">
            <div className="flex flex-col gap-3 pr-8 md:flex-row md:items-start md:justify-between md:pr-12">
              <div className="min-w-0">
                <DialogTitle className="line-clamp-2 text-base leading-snug sm:text-lg md:text-xl">
                  {title}
                </DialogTitle>
                <DialogDescription className="mt-1 line-clamp-1">
                  {subtitle || "Document oficial ANSVSA"}
                </DialogDescription>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                {localPdfUrl && (
                  <a href={localPdfUrl} download target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <Download className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                  </a>
                )}
                {recall.sourceUrl && (
                  <a href={recall.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm">
                      <ExternalLink className="mr-1 h-4 w-4" />
                      Sursa oficiala
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="hidden gap-2 pt-2.5 md:grid md:grid-cols-2 lg:grid-cols-5">
              {detailItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="grid grid-cols-[auto_1fr] gap-x-1.5 rounded-md border bg-muted/30 px-2 py-1.5">
                    <Icon className={`mt-0.5 h-3.5 w-3.5 ${item.warning ? "text-amber-500" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] leading-4 text-muted-foreground">{item.label}</p>
                      <div className="truncate text-xs font-medium leading-4">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogHeader>

          <div className="min-h-0 bg-muted/20 p-2 sm:p-3">
            <div className="h-full min-h-0 overflow-hidden rounded-md border bg-background">
              {displayPdfUrl ? (
                <iframe
                  title={`PDF ${title}`}
                  src={displayPdfUrl}
                  sandbox="allow-downloads allow-same-origin"
                  className="h-full min-h-[70dvh] w-full border-0"
                />
              ) : (
                <div className="flex h-full min-h-[70dvh] items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="mx-auto mb-2 h-8 w-8" />
                    <p className="text-sm">PDF indisponibil</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function categoryBadge(cat: string) {
  const colors: Record<string, string> = {
    alimente: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    lactate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    carne: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    bauturi: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    dulciuri: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  };

  for (const [key, cls] of Object.entries(colors)) {
    if (cat.toLowerCase().includes(key)) return <Badge className={cls}>{cat}</Badge>;
  }
  return <Badge variant="outline">{cat}</Badge>;
}
