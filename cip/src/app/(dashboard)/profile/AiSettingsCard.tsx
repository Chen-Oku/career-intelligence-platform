"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSaveProfileText } from "@/hooks/useProfile";

/**
 * AiSettingsCard — BYOK: the user's own Gemini API key.
 *
 * When saved, this user's AI requests use their key instead of the
 * deployment's shared GEMINI_API_KEY (and as fallback when AI Core is
 * unreachable). Saved through the same profile save endpoint as voiceGuide —
 * it's user-authored config, not generated content.
 */
export function AiSettingsCard({ savedKey }: { savedKey: string }) {
  const t = useTranslations("profile.aiSettings");
  const [value, setValue] = useState(savedKey);
  const [prevSavedKey, setPrevSavedKey] = useState(savedKey);
  const [isVisible, setIsVisible] = useState(false);

  const { mutate: save, isPending: isSaving } = useSaveProfileText();

  if (savedKey !== prevSavedKey) {
    setPrevSavedKey(savedKey);
    setValue(savedKey);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-primary" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={isVisible ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("placeholder")}
              autoComplete="off"
              className="pr-9 font-mono text-xs"
            />
            <Button
              type="button" variant="ghost" size="icon"
              className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setIsVisible((v) => !v)}
              title={isVisible ? t("hide") : t("show")}
            >
              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <Button
            type="button" size="sm"
            className="h-9"
            disabled={isSaving || value === prevSavedKey}
            onClick={() => save({ field: "geminiApiKey", text: value.trim() })}
          >
            {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            {t("save")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("hint")}{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            Google AI Studio
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
