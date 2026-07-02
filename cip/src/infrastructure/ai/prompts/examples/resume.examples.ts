/**
 * Few-shot examples for resume generation.
 *
 * These calibrate qwen3's output style before it sees the user's actual data.
 * Edit or add examples here to steer tone, structure, and specificity.
 * All examples are grounded in the 3D visualization / game dev / creative tech domain.
 */

// ─── Bullet transformations ───────────────────────────────────────────────────
// Format: raw input the user provided → ideal resume bullet.
// Shows the model EXACTLY how to transform unpolished data into strong output.

export const BULLET_TRANSFORMATIONS = `
EXAMPLE 1 — Architectural Visualization
Raw responsibility: "Created 3D renders for real estate clients"
Raw achievement: "Clients were happy with results, got repeat business"
↓ IDEAL BULLET:
"Produced 40+ photorealistic exterior and interior renders for luxury residential projects across Colombia and the US, achieving a 95% client approval rate and securing 3 recurring accounts."

EXAMPLE 2 — Game Development / Unreal Engine
Raw responsibility: "Worked on performance optimization for game environments"
Raw achievement: "Reduced lag in the main level"
↓ IDEAL BULLET:
"Optimized real-time environments in Unreal Engine 5 using LOD strategies, texture streaming, and draw call reduction, achieving stable 60fps on target hardware — down from 35fps pre-optimization."

EXAMPLE 3 — Technical Artist / Pipeline
Raw responsibility: "Helped with shader work and tools for the art team"
Raw achievement: "Made the shader compile faster"
↓ IDEAL BULLET:
"Rewrote the studio's HLSL shader pipeline, cutting compile time by 40% and eliminating a recurring bottleneck that had blocked artists during daily review cycles."

EXAMPLE 4 — 3D Generalist / Blender
Raw responsibility: "Modeled and rigged characters for animation projects"
Raw achievement: "Delivered on tight deadlines"
↓ IDEAL BULLET:
"Modeled, UV-unwrapped, and rigged 12 production-ready characters in Blender for a 26-episode animated series, consistently meeting weekly delivery deadlines across a 6-month production cycle."
`.trim();

// ─── Summary example ─────────────────────────────────────────────────────────

export const SUMMARY_EXAMPLE = `
EXAMPLE — Professional Summary
"3D Artist and Technical Director with 9 years delivering high-end architectural visualization and real-time environments for residential, hospitality, and commercial clients across Latin America and Europe. Expert in Corona Renderer, 3ds Max, and Unreal Engine 5. Known for bridging creative direction and technical execution — from concept lighting to final delivery pipeline. Currently focused on expanding into interactive real-time experiences and XR projects."
`.trim();

// ─── Project description example ─────────────────────────────────────────────

export const PROJECT_EXAMPLE = `
EXAMPLE — Project Description
"Led the end-to-end visualization of a 120-unit luxury residential tower in Bogotá: modeled the full exterior and 6 interior units in 3ds Max, lit with Corona Renderer, and delivered 32 final renders used in the client's pre-sales campaign. Project sold 80% of units within the first month of launch."
`.trim();
