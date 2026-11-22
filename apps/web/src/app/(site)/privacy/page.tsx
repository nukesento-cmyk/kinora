import { LegalDocument } from "@/components/site/legal-document";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("legal.privacy", siteRoutes.privacy);

export default function PrivacyPage() {
  return <LegalDocument doc="privacy" />;
}
