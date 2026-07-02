/**
 * Few-shot examples for profile bio and elevator pitch generation.
 *
 * These calibrate qwen3's voice and structure before it sees the user's data.
 * Edit examples here to adjust tone (more formal, more conversational, etc.)
 * without touching the prompt logic.
 */

// ─── About Me example ────────────────────────────────────────────────────────
// Shows: specific, confident, no clichés, grounded in real details.

export const ABOUT_ME_EXAMPLE = `
EXAMPLE — About Me (5–8 sentences, first person, professional)

"I’m a multidisciplinary 3D Artist and Technical Artist with 9+ years of experience working across Architectural Visualization, design, and real-time environments. My core focus is building high-quality visual experiences using tools like 3ds Max, Corona Renderer, and increasingly Unreal Engine for interactive and real-time workflows.

Over my career, I’ve moved between industrial design, ArchViz, and game development, which has given me a systems-thinking approach to problem solving — I don’t just execute visuals, I understand pipelines, constraints, and how to improve production workflows.

Right now I’m focused on roles where visual quality, technical depth, and real-time innovation intersect, especially teams building next-generation ArchViz or interactive 3D experiences."
`.trim();

// ─── Elevator pitch example ───────────────────────────────────────────────────
// Shows: punchy, spoken-word rhythm, who → standout achievement → what's next.
// 75–150 words, no stock phrases.

export const ELEVATOR_PITCH_EXAMPLE = `
EXAMPLE — Elevator Pitch (spoken, 30–60 seconds)

"I’m a multidisciplinary 3D Artist and Technical Artist with 9+ years of experience across architectural visualization, design, and interactive 3D. I started in industrial design and moved into ArchViz, where I’ve spent most of my career building photorealistic environments and helping teams turn technical drawings into high-end visual experiences.

What makes my profile different is that I don’t stay only on the artistic side — I naturally move into pipelines, tools, and systems. In several projects I’ve helped optimize workflows, improve scene structure, and guide teams through technical decisions to speed up production.

Recently I’ve been shifting into Unreal Engine and real-time workflows because I see a clear future in interactive visualization. I’m now looking for roles where I can combine visual quality with technical problem-solving in real-time or high-end ArchViz teams."
`.trim();

// ─── Strengths example ────────────────────────────────────────────────────────
// Shows: synthesizes a pattern across disciplines/roles rather than listing
// skills — grounded in what the profile actually shows, not a generic list.

export const STRENGTHS_EXAMPLE = `
EXAMPLE — Strengths (3–4 short paragraphs, first person, professional)

"My biggest strength is my ability to learn quickly and connect knowledge across different disciplines. I've worked across industrial design, architectural visualization, real-time engines, and game development — different fields on the surface, but they all share the same core: design thinking, problem-solving, and building experiences for people.

That range shows up in how I work. I move comfortably between technical constraints and creative decisions, and within a team I tend to take on a supporting role — listening first, understanding what's already been built, and helping people find a path forward rather than starting over.

Colleagues who've worked with me point to two things most often: how fast I pick up new tools, and how I connect the dots between areas other people treat as separate."
`.trim();