import { LegalDocument } from "@/components/site/legal-document";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("legal.guidelines", siteRoutes.guidelines);

export default function CommunityGuidelinesPage() {
  return <LegalDocument doc="guidelines" />;
}
