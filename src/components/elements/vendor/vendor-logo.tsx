import {
  getVendor,
  vendorMonogram,
  bookName,
} from "@/lib/config/vendor-registry";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function VendorLogo(props: {
  vendorKey: string;
  size?: number;
  className?: string;
}) {
  const size = props.size ?? 20;
  const vendor = getVendor(props.vendorKey);
  const name = bookName(props.vendorKey);

  if (!vendor?.logo) {
    const monogram = vendorMonogram(props.vendorKey);
    // Square like the logo tiles so names stay aligned in lists.
    return (
      <span
        role="img"
        aria-label={name}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(5, size * (monogram.length > 2 ? 0.3 : 0.4)),
        }}
        className={cn(
          "ring-foreground/15 bg-muted text-foreground/80 inline-flex shrink-0 items-center justify-center overflow-hidden rounded-sm font-mono leading-none font-bold tracking-tighter ring-1",
          props.className,
        )}
      >
        {monogram}
      </span>
    );
  }

  if (vendor.shape === "mono") {
    const mask = `url(${vendor.logo})`;
    return (
      <span
        role="img"
        aria-label={name}
        className={cn("inline-block shrink-0 bg-current", props.className)}
        style={{
          width: size,
          height: size,
          maskImage: mask,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskImage: mask,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
    );
  }

  return (
    <Image
      src={vendor.logo}
      alt={name}
      width={size}
      height={size}
      unoptimized
      className={cn(
        "shrink-0 object-contain",
        vendor.shape === "tile" && "ring-foreground/10 rounded-sm ring-1",
        props.className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

export function VendorLabel(props: {
  vendorKey: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", props.className)}>
      <VendorLogo vendorKey={props.vendorKey} size={props.size ?? 16} />
      <span className="truncate">{bookName(props.vendorKey)}</span>
    </span>
  );
}

// Regional brands share a logo, so the stack shows each logo once.
export function VendorStack(props: {
  vendorKeys: string[];
  max?: number;
  size?: number;
  className?: string;
}) {
  const max = props.max ?? 8;
  const seen = new Set<string>();
  const unique = props.vendorKeys.filter((key) => {
    const id = getVendor(key)?.name ?? key;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return (
    <span
      className={cn("inline-flex items-center gap-1", props.className)}
      title={props.vendorKeys.map(bookName).join(", ")}
    >
      {unique.slice(0, max).map((key) => (
        <VendorLogo key={key} vendorKey={key} size={props.size ?? 16} />
      ))}
      {unique.length > max && (
        <span className="text-muted-foreground tabular text-[10px]">
          +{unique.length - max}
        </span>
      )}
    </span>
  );
}
