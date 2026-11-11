import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ArbCalculator, DevigCalculator, EvCalculator, OddsConverter } from "./calculators";

export const metadata: Metadata = { title: "Calculators" };

export default function Tools() {
  return (
    <>
      <PageHeader eyebrow="Tools" title="Calculators">
        The same maths the engine runs, for checking a price by hand.
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <EvCalculator />
        <DevigCalculator />
        <ArbCalculator />
        <OddsConverter />
      </div>
    </>
  );
}
