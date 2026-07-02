"use client";

import { SkillsDatabase } from "@/components/career/SkillsDatabase";

/**
 * Skills page is intentionally thin — all logic lives in SkillsDatabase.
 *
 * Why split page from component?
 * The page is a Next.js route boundary (metadata, auth redirects).
 * The component is reusable — the Dashboard could embed a summary
 * of top skills without routing to this page.
 */
export default function SkillsPage() {
  return <SkillsDatabase />;
}
