import { notFound } from "next/navigation";

// Unknown localized paths render the navbar not found page instead of Next's bare default.
export default function CatchAllPage() {
  notFound();
}
