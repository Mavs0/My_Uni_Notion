/** Fallback para layouts que envolvem páginas com useSearchParams (requisito Next.js 15). */
export function SearchParamsRouteFallback() {
  return (
    <div
      className="flex min-h-[50vh] w-full items-center justify-center bg-background"
      aria-busy
      aria-label="A carregar"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-primary" />
    </div>
  );
}
