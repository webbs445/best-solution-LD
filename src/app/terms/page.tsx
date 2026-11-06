import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms and Conditions | Best Solution",
  description: "The terms that apply when you engage Best Solution.",
  alternates: { canonical: "https://business.best-solution.ae/terms" },
};

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
