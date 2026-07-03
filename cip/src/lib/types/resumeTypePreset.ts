import { ResumeTypePreset } from "@/domain/document/entities/ResumeTypePreset";

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface ResumeTypePresetDTO {
  id: string;
  name: string;
  focus: string;
  vocabulary?: string;
  prioritizeKeywords: string[];
  defaultTitle?: string;
}

export function toResumeTypePresetDTO(preset: ResumeTypePreset): ResumeTypePresetDTO {
  return {
    id: preset.id,
    name: preset.name,
    focus: preset.focus,
    vocabulary: preset.vocabulary,
    prioritizeKeywords: [...preset.prioritizeKeywords],
    defaultTitle: preset.defaultTitle,
  };
}
