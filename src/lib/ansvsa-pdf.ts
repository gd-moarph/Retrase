export function isAllowedAnsvsaPdfUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isAnsvsaHost = hostname === "ansvsa.ro" || hostname.endsWith(".ansvsa.ro");

    return (
      url.protocol === "https:" &&
      isAnsvsaHost &&
      url.pathname.toLowerCase().endsWith(".pdf")
    );
  } catch {
    return false;
  }
}
