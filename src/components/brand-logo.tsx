import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/retrase-logo.svg"
        alt="Retrase.ro"
        className={cn("h-9 w-auto", imageClassName)}
      />
    </span>
  );
}
