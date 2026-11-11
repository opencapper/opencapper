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
      <Navbar email={account?.user.email} />
      <main className="bg-background flex-1 pt-12">{props.children}</main>
      <div className="bg-background">
        <Footer />
      </div>
    </>
  );
}
