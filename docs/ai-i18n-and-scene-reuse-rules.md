# AI Rules: i18n and Scene Reuse

## Rule 1 - No Hardcoded User Text

Mandatory rule for any AI-generated change:
- Any text shown to the player must be defined in translation files under `src/i18n/**`.
- Scene, component, and service files must not contain direct user-facing strings.
- When adding a new dialogue, option label, lock message, door label, modal copy, or menu text:
  1. Add it to i18n.
  2. Reference it by key in the scene/component.

Allowed hardcoded text:
- Technical logs (`console.log`, `console.warn`, `console.error`).
- Internal keys/IDs/flags/events.
- Developer-only comments.

Forbidden hardcoded text:
- `showDialog` content.
- `showOptionsDialog` greetings and labels.
- Door labels and locked messages.
- Any visible gameplay copy.

## Rule 2 - Shared Behavior Must Be Abstracted

When two or more scenes share behavior, extract it to reusable structures.

Preferred extraction targets:
- `src/scenes/map/services/**` for scene-level reusable flow.
- `src/utils/**` for generic helpers.
- Base scene methods only when behavior is truly common for all map scenes.

Current shared abstraction in project:
- `SceneDialogueFlowService` centralizes:
  - dialog scene readiness and launch,
  - common `showDialog` / `showOptionsDialog` access,
  - Likert option generation,
  - axis points accumulation,
  - axis choice timeline append.

## PR/Task Checklist (must pass)

- [ ] No new player-facing literal string in scene/component/service code.
- [ ] New text is in `src/i18n/**` and referenced from code.
- [ ] If behavior is duplicated in 2+ scenes, abstraction was created/reused.
- [ ] Existing scene-specific methods keep only map-specific logic.
- [ ] Build passes after changes.

## AI Enforcement Instruction

When generating code in this repository, always apply:
- i18n-first for all user-facing text.
- abstraction-first for repeated scene logic.
- scene files must focus on orchestration, not duplicated mechanics.
