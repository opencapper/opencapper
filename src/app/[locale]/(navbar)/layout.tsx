import { Footer } from "@/components/layout/nav/footer";
import { Navbar } from "@/components/layout/nav/navbar";

type Props = {
  children: React.ReactNode;
};

export default function NavbarLayout(props: Props) {
  return (
    <>
      <Navbar />
      <main className="bg-background flex-1 pt-12">{props.children}</main>
      <div className="bg-background">
        <Footer />
      </div>
    </>
  );
}
