// One-off migration: seeds chenoku@gmail.com's 7 removed hardcoded resume
// types (formerly the ResumeType enum + TYPE_PROFILES/RESUME_TYPE_DEFAULT_TITLE
// in resume.prompts.ts / resume.schema.ts) as their own personal
// ResumeTypePreset rows, so their existing generation setup isn't lost by
// the move to per-user presets. New users get zero presets by default.
//
// Idempotent — safe to re-run: skips any legacy type whose name the user
// already has a preset for.
//
// Run with: npx tsx scripts/seed-legacy-resume-type-presets.ts

import { prisma } from "../src/infrastructure/database/client";
import { PrismaResumeTypePresetRepository } from "../src/infrastructure/database/repositories/PrismaResumeTypePresetRepository";
import { CreateResumeTypePresetUseCase } from "../src/application/document/resume-type-preset-use-cases";

const TARGET_EMAIL = "chenoku@gmail.com";

const LEGACY_TYPES = [
  {
    name: "Architectural Visualization",
    focus: "Photorealistic rendering, architectural software expertise, project scale, client presentation impact.",
    vocabulary: "ArchViz, visualization, rendering, photorealistic, immersive, spatial, walkthrough, fly-through.",
    prioritizeKeywords: ["3ds Max", "Corona", "V-Ray", "Unreal Engine", "rendering", "visualization", "architecture"],
    defaultTitle: "Architectural Visualization Artist",
  },
  {
    name: "Gameplay / Level Design",
    focus: "Real-time environments, game engines, performance optimization, interactive design.",
    vocabulary: "Real-time, frame budget, LOD, game-ready, optimization, playtest, iteration.",
    prioritizeKeywords: ["Unreal Engine", "Unity", "gameplay", "level design", "real-time", "optimization"],
    defaultTitle: "Gameplay / Level Designer",
  },
  {
    name: "Technical Artist",
    focus: "Pipeline tools, shaders, optimization, the bridge between art and engineering.",
    vocabulary: "Shader, pipeline, LOD, rig, tool, automation, procedural, optimization.",
    prioritizeKeywords: ["Python", "MEL", "shader", "pipeline", "tool", "automation", "rigging", "scripting"],
    defaultTitle: "Technical Artist",
  },
  {
    name: "Graphic Designer",
    focus: "Visual identity, layout composition, typography, brand consistency across deliverables.",
    vocabulary: "Brand identity, layout, typography, composition, print-ready, art direction.",
    prioritizeKeywords: ["Photoshop", "Illustrator", "InDesign", "Figma", "typography", "branding", "layout"],
    defaultTitle: "Graphic Designer",
  },
  {
    name: "BTL / Brand Activation",
    focus: "Brand activations, spatial design, production coordination, client presentations.",
    vocabulary: "Brand experience, activation, installation, spatial, production-ready, fabrication.",
    prioritizeKeywords: ["activation", "production", "spatial design", "fabrication", "client presentation"],
    defaultTitle: "BTL / Brand Activation Designer",
  },
  {
    name: "Environment Artist",
    focus: "World-building, terrain/foliage systems, modular environment kits, visual storytelling through space.",
    vocabulary: "Modular kit, terrain, foliage, lighting mood, environment storytelling, set dressing.",
    prioritizeKeywords: ["World Machine", "Substance", "Unreal Engine", "modular", "terrain", "environment", "lighting"],
    defaultTitle: "Environment Artist",
  },
  {
    name: "VFX Artist",
    focus: "Particle/simulation systems, real-time or offline effects, performance budget for effects.",
    vocabulary: "Particle system, simulation, Niagara, compositing, effect budget, shader-driven FX.",
    prioritizeKeywords: ["Niagara", "Houdini", "particle", "simulation", "compositing", "effects"],
    defaultTitle: "VFX Artist",
  },
];

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL }, select: { id: true } });
  if (!user) throw new Error(`User ${TARGET_EMAIL} not found.`);

  const presetRepo = new PrismaResumeTypePresetRepository();
  const existing = await presetRepo.findByUserId(user.id);
  const existingNames = new Set(existing.map((p) => p.name));

  let created = 0;
  let skipped = 0;

  for (const legacyType of LEGACY_TYPES) {
    if (existingNames.has(legacyType.name)) {
      console.log(`SKIP (already exists): ${legacyType.name}`);
      skipped++;
      continue;
    }

    const result = await new CreateResumeTypePresetUseCase(presetRepo).execute({
      userId: user.id,
      ...legacyType,
    });

    if (!result.ok) {
      console.error(`FAILED: ${legacyType.name} — ${result.error.message}`);
      continue;
    }

    console.log(`CREATED: ${legacyType.name} (${result.value.id})`);
    created++;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (of ${LEGACY_TYPES.length}).`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
