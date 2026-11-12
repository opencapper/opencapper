import { Footer } from "@/components/layout/nav/footer";
import { Navbar } from "@/components/layout/nav/navbar";
import { getAccount } from "@/lib/auth/session";

type Props = {
  children: React.ReactNode;
};

export default async function NavbarLayout(props: Props) {
  const account = await getAccount();
  return (
    <>
      <Navbar user={account?.user} />
      <main className="bg-background flex-1 pt-14">{props.children}</main>
      <div className="bg-background">
        <Footer />
      </div>
    </>
  );
}
