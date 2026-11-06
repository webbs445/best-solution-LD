import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Best Solution",
  description: "How Best Solution collects, uses, shares and protects your personal data.",
  alternates: { canonical: "https://business.best-solution.ae/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
