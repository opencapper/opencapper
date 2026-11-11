import type { IconName } from "@/lib/config/icon-map";
import { LUCIDE_STATIC } from "@/lib/config/lucide-static";

type Props = React.SVGAttributes<SVGSVGElement> & {
  name: IconName;
  size?: number | string;
};

export function Icon(props: Props) {
  const { name, size, ...rest } = props;
  const StaticIcon = LUCIDE_STATIC[name];
  return <StaticIcon width={size ?? "1em"} height={size ?? "1em"} {...rest} />;
}
