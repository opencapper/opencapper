import { LandingHero } from "@/components/pages/navbar/home/landing-hero";
import { loadLanding } from "@/components/pages/navbar/home/landing-data";
import { LandingReadme } from "@/components/pages/navbar/home/landing-readme";
import { getAccount } from "@/lib/auth/session";
import { serverLocale } from "@/lib/utils/server";
import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const account = await getAccount();
  const data = await loadLanding(account !== undefined);

  return (
    <div className="relative lg:-mt-12">
      <div className="flex flex-col lg:flex-row lg:items-start">
        <LandingHero data={data} />
        <LandingReadme data={data} />
      </div>
    </div>
  );
}
