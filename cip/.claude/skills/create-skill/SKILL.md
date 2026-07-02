---
name: create-skill
user-invocable: true
description: "Create or update a workspace skill file (SKILL.md) for VS Code agent customization workflows."
---

# Create Skill

This workspace skill guides the user through creating a reusable `SKILL.md` file for VS Code agent customization.

## What this skill produces

- A workspace skill file in a supported location
- A clear frontmatter block with `name`, `user-invocable`, and `description`
- A step-by-step workflow for authoring skills, including scope, placement, and validation

## When to use

Use this skill when you need to:
- create a new `SKILL.md` for a project-specific workflow
- update an existing skill with better structure or metadata
- choose the right customization primitive for VS Code agent tooling

## Workflow

1. Determine scope
   - Workspace-scoped: put the skill under `.github/skills/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md`
   - User-scoped: use `{{VSCODE_USER_PROMPTS_FOLDER}}/` for personal prompt/instruction files, but skills belong in workspace skill folders.

2. Choose the right primitive
   - `SKILL.md` for multi-step workflows and reusable guidance
   - `.prompt.md` for single-task parameterized prompts
   - `.instructions.md` for always-on or file-specific guidance

3. Write the skill file
   - Include YAML frontmatter at the top
   - Use a descriptive `name`
   - Add `user-invocable: true` if the skill should be callable by slash command
   - Write a concise `description` with trigger keywords

4. Include reusable guidance
   - What the skill does
   - When to use it
   - The step-by-step creation process
   - Validation checks and common pitfalls

5. Validate the skill
   - Confirm the file is placed in a workspace skill folder
   - Verify YAML formatting and quoting
   - Make sure `description` contains searchable trigger phrases

## Validation checklist

- [ ] `SKILL.md` is created in `.claude/skills/<name>/SKILL.md` or `.github/skills/<name>/SKILL.md`
- [ ] YAML frontmatter is correctly formatted
- [ ] `name`, `user-invocable`, and `description` are present
- [ ] The body explains purpose, workflow, and when to use the skill
- [ ] The skill is short, actionable, and easy to reuse

## Example prompts

- `/create-skill help me author a new workflow skill`
- `/create-skill add a SKILL.md for this repository`
- `/create-skill review my skill file structure`
