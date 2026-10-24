import { LOCALES } from "@/lib/config/constants";
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect(`/${LOCALES[0]}`);
}
