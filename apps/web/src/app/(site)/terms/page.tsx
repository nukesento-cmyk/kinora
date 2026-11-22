import { LegalDocument } from "@/components/site/legal-document";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("legal.terms", siteRoutes.terms);

export default function TermsPage() {
  return <LegalDocument doc="terms" />;
}
