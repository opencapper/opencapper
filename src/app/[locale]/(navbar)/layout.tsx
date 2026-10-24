import { Footer } from "@/components/layout/nav/footer";
import { Navbar } from "@/components/layout/nav/navbar";
import getQueryClient from "@/lib/react-query/client";
import { prefetchAuth } from "@/lib/react-query/prefetch";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

type Props = {
  children: React.ReactNode;
};

export default async function NavbarLayout(props: Props) {
  const queryClient = getQueryClient();
  await prefetchAuth(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Navbar />
      <main className="bg-background flex-1 pt-12">{props.children}</main>
      <div className="bg-background">
        <Footer />
      </div>
    </HydrationBoundary>
  );
}
