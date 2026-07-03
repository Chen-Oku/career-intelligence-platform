"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { useProfileTexts } from "@/hooks/useProfile";
import { ProviderStatusCard } from "./ProviderStatusCard";
import { AiSettingsCard } from "./AiSettingsCard";

export function SettingsClient() {
  const t = useTranslations("settings");
  const { data } = useProfileTexts();

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
      <div className="mt-6 space-y-6">
        <ProviderStatusCard />
        <AiSettingsCard savedKey={data?.geminiApiKey ?? ""} />
      </div>
    </div>
  );
}
