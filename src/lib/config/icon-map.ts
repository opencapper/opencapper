import type { LUCIDE_STATIC } from "@/lib/config/lucide-static";
import type { ComponentType, SVGAttributes } from "react";

export type IconComponent = ComponentType<
  SVGAttributes<SVGSVGElement> & { size?: number | string }
>;

export type IconName = keyof typeof LUCIDE_STATIC;
