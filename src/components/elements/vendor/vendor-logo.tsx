import {
  getVendor,
  vendorMonogram,
  vendorName,
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
  const name = vendorName(props.vendorKey);

  if (!vendor?.logo) {
    return (
      <span
        role="img"
        aria-label={name}
        style={{
          height: size,
          minWidth: size,
          fontSize: Math.max(7, size * 0.42),
        }}
        className={cn(
          "border-border text-foreground/70 inline-flex shrink-0 items-center justify-center rounded-sm border px-0.5 font-mono leading-none font-semibold tracking-wider",
          props.className,
        )}
      >
        {vendorMonogram(props.vendorKey)}
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
      <span className="truncate">{vendorName(props.vendorKey)}</span>
    </span>
  );
}
