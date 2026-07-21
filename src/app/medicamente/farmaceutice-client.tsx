"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Pill, Search } from "lucide-react";
import { toast } from "sonner";

interface MedicineItem {
  id: string;
  commercialName: string;
  dci: string | null;
  authorizationHolder: string | null;
  notificationType: string | null;
  addressDate: string | null;
  pharmaceuticalForm: string | null;
  concentration: string | null;
  firstSeenAt: string;
}

export function FarmaceuticeClient() {
  const [items, setItems] = useState<MedicineItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/farmaceutice/produse?${params}`);
      if (!res.ok) throw new Error("Datele nu sunt disponibile");
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Eroare la încărcarea datelor");
    } finally {
      setLoading(false);
    }
  }, [page, sort, search]);

  useEffect(() => {
    const timer = setTimeout(() => void fetchItems(), 0);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchInput]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-linear-to-b from-background to-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <Pill className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">Medicamente retrase din România</h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Monitorizează notificările de discontinuitate publicate de ANMDMR. Vezi medicamente retrase, întrerupte
              sau reluate direct pe această pagină.
            </p>
          </div>
        </section>

        <section className="pb-8 pt-4">
          <div className="container mx-auto px-4">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input
                      placeholder="Caută după denumire, DCI, deținător..."
                      className="h-10 pl-9"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Ordonare medicamente"
                    className="h-10 shrink-0 rounded-md border bg-background px-3 text-sm sm:w-44"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="newest">Cele mai recente</option>
                    <option value="oldest">Cele mai vechi</option>
                  </select>
                  <a
                    className={buttonVariants({ className: "h-10 shrink-0 sm:w-36" })}
                    href="/api/export/farmaceutice"
                  >
                    Exportă XLSX
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <Table className="text-[15px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Denumire comercială</TableHead>
                        <TableHead className="hidden md:table-cell">DCI</TableHead>
                        <TableHead className="hidden lg:table-cell">Deținător</TableHead>
                        <TableHead className="hidden sm:table-cell">Tip</TableHead>
                        <TableHead className="hidden md:table-cell">Dată</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Se încarcă...</TableCell></TableRow>
                      ) : items.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Niciun rezultat.</TableCell></TableRow>
                      ) : items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-[360px] whitespace-normal break-words py-2 font-medium leading-5">{item.commercialName || "-"}</TableCell>
                          <TableCell className="hidden max-w-[260px] whitespace-normal break-words py-2 leading-5 text-muted-foreground md:table-cell">{item.dci || "-"}</TableCell>
                          <TableCell className="hidden max-w-[320px] whitespace-normal break-words py-2 leading-5 text-muted-foreground lg:table-cell">{item.authorizationHolder || "-"}</TableCell>
                          <TableCell className="hidden max-w-[260px] whitespace-normal break-words py-2 leading-5 sm:table-cell">{item.notificationType || "-"}</TableCell>
                          <TableCell className="hidden whitespace-nowrap py-2 text-muted-foreground md:table-cell">
                            {item.addressDate || new Date(item.firstSeenAt).toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{total} rezultate — pagina {page} din {totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> Anterioară
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                        Următoarea <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
