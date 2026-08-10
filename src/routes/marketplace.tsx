import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const Route = createFileRoute("/marketplace")({
  component: MarketplaceLayout,
});

function MarketplaceLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <SiteHeader />
      <main className="flex-grow pt-24">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
