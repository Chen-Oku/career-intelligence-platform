"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2, MessageSquareText, Plus, RefreshCw, Send, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAssistantChat, useApplySuggestion, isSuggestionApplicable } from "@/hooks/useAssistant";
import type { AssistantMessage, AssistantSection, AssistantSuggestion } from "@/lib/types/assistant";

interface ChatMessage extends AssistantMessage {
  suggestions?: AssistantSuggestion[];
  isError?: boolean;
}

const SECTION_ROUTES: Record<AssistantSection, string> = {
  SKILL: "/skills",
  EXPERIENCE: "/experience",
  PROJECT: "/projects",
  STORY: "/stories",
};

/** How many recent turns travel with each request (server caps at 12). */
const HISTORY_WINDOW = 10;

/**
 * AssistantWidget — floating career-assistant chat, mounted once in the
 * dashboard layout so it survives navigation between sections and the
 * conversation carries across the whole platform.
 *
 * The server is stateless; the transcript lives in this component's state
 * for the lifetime of the dashboard layout. Suggestions are applied through
 * each section's existing create endpoint, so all domain rules (userId
 * scoping, duplicate-skill checks, Zod validation) apply unchanged.
 */
export function AssistantWidget() {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());

  const chat = useAssistantChat();
  const apply = useApplySuggestion();

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = () => {
    const message = input.trim();
    if (!message || chat.isPending) return;

    const history: AssistantMessage[] = messages
      .filter((m) => !m.isError)
      .slice(-HISTORY_WINDOW)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");

    chat.mutate(
      { message, language: locale, history },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply, suggestions: data.suggestions },
          ]);
        },
        onError: (error: Error) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: error.message || t("error"), isError: true },
          ]);
        },
      },
    );
  };

  const applySuggestion = (suggestion: AssistantSuggestion, key: string) => {
    apply.mutate(suggestion, {
      onSuccess: () => {
        setAppliedKeys((prev) => new Set(prev).add(key));
        toast({
          title: t(suggestion.action === "UPDATE" ? "appliedUpdateToast" : "appliedToast", {
            title: suggestion.title,
          }),
        });
      },
      onError: (error: Error) => {
        toast({ title: t("applyError"), description: error.message, variant: "destructive" });
      },
    });
  };

  return (
    <>
      {/* Launcher */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
          title={t("open")}
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(600px,calc(100vh-6rem))] w-[min(400px,calc(100vw-3rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none">{t("title")}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{t("subtitle")}</p>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => { setMessages([]); setAppliedKeys(new Set()); }}
                title={t("clear")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
              title={t("close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <MessageSquareText className="h-8 w-8 text-muted-foreground/40" />
                <p className="max-w-[260px] text-xs text-muted-foreground">{t("emptyState")}</p>
              </div>
            )}

            {messages.map((message, msgIndex) => (
              <div key={msgIndex} className={cn("flex flex-col gap-2", message.role === "user" && "items-end")}>
                {message.content && <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.isError
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-foreground",
                  )}
                >
                  {message.content}
                </div>}

                {message.suggestions?.map((suggestion, sugIndex) => {
                  const key = `${msgIndex}:${sugIndex}`;
                  const isApplied = appliedKeys.has(key);
                  const isApplicable = isSuggestionApplicable(suggestion);

                  return (
                    <div key={key} className="w-[85%] rounded-lg border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-1">
                            <Badge variant="secondary" className="text-[10px]">
                              {t(`sections.${suggestion.section}`)}
                            </Badge>
                            {suggestion.action === "UPDATE" && (
                              <Badge variant="outline" className="gap-1 text-[10px] text-primary border-primary/40">
                                <RefreshCw className="h-2.5 w-2.5" />
                                {t("updateBadge")}
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-sm font-medium">{suggestion.title}</p>
                        </div>
                        {isApplied ? (
                          <Button asChild size="sm" variant="ghost" className="h-7 shrink-0 gap-1 px-2 text-xs text-primary">
                            <Link href={SECTION_ROUTES[suggestion.section]}>
                              <Check className="h-3.5 w-3.5" />
                              {t("applied")}
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 shrink-0 gap-1 px-2 text-xs"
                            disabled={!isApplicable || apply.isPending}
                            onClick={() => applySuggestion(suggestion, key)}
                          >
                            {apply.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : suggestion.action === "UPDATE" ? (
                              <RefreshCw className="h-3.5 w-3.5" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            {suggestion.action === "UPDATE" ? t("applyUpdate") : t("apply")}
                          </Button>
                        )}
                      </div>
                      {suggestion.reason && (
                        <p className="mt-1.5 text-xs text-muted-foreground">{suggestion.reason}</p>
                      )}
                      {!isApplicable && !isApplied && (
                        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-500">
                          {t("incomplete")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {chat.isPending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("thinking")}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t("placeholder")}
                rows={2}
                className="min-h-0 flex-1 resize-none text-sm"
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={!input.trim() || chat.isPending}
                onClick={sendMessage}
                title={t("send")}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
