"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
  /** If true, validates that each tag is a URL */
  urlMode?: boolean;
}

/**
 * TagInput — manages a string[] field with a tag UI.
 *
 * Controls:
 * - Enter or click + to add
 * - Backspace on empty input removes last tag
 * - Click × to remove any tag
 *
 * Integrates with react-hook-form via Controller:
 *   <Controller name="technologies" control={form.control}
 *     render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
 *   />
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  max = 20,
  className,
  urlMode = false,
}: TagInputProps) {
  const t = useTranslations("common.tagInput");
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const atMax = value.length >= max;
  const effectivePlaceholder = placeholder ?? t("typeAndPressEnter");

  const validate = useCallback(
    (text: string): string | null => {
      if (!text.trim()) return t("cannotBeEmpty");
      if (urlMode) {
        try {
          new URL(text);
        } catch {
          return t("mustBeValidUrl");
        }
      }
      if (value.includes(text.trim())) return t("alreadyAdded");
      return null;
    },
    [value, urlMode, t],
  );

  const addTag = useCallback(() => {
    const trimmed = inputValue.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    onChange([...value, trimmed]);
    setInputValue("");
    setError(null);
  }, [inputValue, value, onChange, validate]);

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
    if (error) setError(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Tag list */}
      {value.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant="secondary"
              className="h-6 gap-1 pl-2.5 pr-1.5 text-xs font-normal"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t("removeTag", { tag })}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={atMax ? t("maximumReached", { max }) : effectivePlaceholder}
          disabled={atMax}
          className={cn("h-8 text-sm", error && "border-destructive")}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={addTag}
          disabled={!inputValue.trim() || atMax}
          aria-label={t("addItem")}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Feedback */}
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : (
          <span />
        )}
        <p className="text-[11px] font-mono-data text-muted-foreground">
          {value.length}/{max}
        </p>
      </div>
    </div>
  );
}
