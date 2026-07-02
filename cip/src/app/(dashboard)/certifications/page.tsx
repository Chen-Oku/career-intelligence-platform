"use client";

import { CertificationsList } from "@/components/career/CertificationsList";

/**
 * Certifications page — thin route boundary, same split as the Skills page:
 * all logic lives in the CertificationsList component.
 */
export default function CertificationsPage() {
  return <CertificationsList />;
}
