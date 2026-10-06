import { FZ_SITELINK_VIEWS } from "@/content/freezone";
import { FreeZoneLanding, FZ_METADATA } from "@/components/freezone/FreeZoneLanding";

/*
  Google Ads sitelink destinations: /freezone/planner, /compare, /activity, /budget, /vs-mainland,
  /consultation (and the spare /dubai). Each serves the same landing page with HTTP 200, keeps the
  query string, and shares /freezone's canonical. An unknown view renders the page at the top.
*/

export const metadata = FZ_METADATA;

export function generateStaticParams() {
  return FZ_SITELINK_VIEWS.map((view) => ({ view }));
}

export default async function FreeZoneSitelinkPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  return <FreeZoneLanding view={view} />;
}
