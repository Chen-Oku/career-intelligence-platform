"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSaveProfileText } from "@/hooks/useProfile";

const MAX_LENGTH = 1000;

/**
 * VoiceGuideCard — the user's own style preferences (tone, words to
 * avoid/prefer), authored directly rather than generated. Saved via the
 * same profile save endpoint as the other fields, but with no Generate/
 * Evaluate actions since there's nothing for AI to generate here — this
 * guide is what shapes those other generations, not a product of them.
 */
export function VoiceGuideCard({ savedText }: { savedText: string }) {
  const t = useTranslations("profile.voiceGuide");
  const [text, setText] = useState(savedText);
  const [prevSavedText, setPrevSavedText] = useState(savedText);

  const { mutate: save, isPending: isSaving } = useSaveProfileText();

  if (savedText !== prevSavedText) {
    setPrevSavedText(savedText);
    setText(savedText);
  }

  const handleSave = () => save({ field: "voiceGuide", text });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          className="min-h-[140px] text-sm resize-y font-mono-data"
        />
        <p className={`text-xs text-right ${text.length > MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
          {text.length} / {MAX_LENGTH}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={text.length > MAX_LENGTH || isSaving}
            onClick={handleSave}
            className="ml-auto"
          >
            {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            {t("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
