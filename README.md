# CURSED 100: Hong Kong

A neon-noir browser prototype for a supernatural deduction survival game, set in Mong Kok, Hong Kong.

## Play locally

Open `index.html` in a modern desktop browser. No build tool, packages, or internet connection are required.

**Controls:** WASD or arrow keys to move; click a walkable tile to move one step; E selects the nearest visible person; click entries in the Nearby panel to select. Use Talk, Observe, Investigate, Set Target, Use Curse, and Advance to Dawn buttons.

Enable music through **Sound: On** after entering the game (browser audio requires a user gesture).

## Current prototype

- English-only interface with an isolated translation dictionary for future localization (`en`, later `ko` and `zh-HK`).
- **v0.9 graphical refresh**: detailed 24×17-tile procedural Hong Kong pixel-art district, with four distinct roof and storefront styles, Chinese/English signage, wet pavement, narrow sidewalks, lit windows, rooftop machinery, street furniture, signs and night-market stalls.
- Animated **rain**, neon light pools, wet-road reflections and subtle character idle movement, using a cached static scenery layer to limit frame rendering costs.
- Deterministically generated character **visual styles** (hair, clothes, accessories and color combinations) based on each character's ID. Clothing never depends on whether someone is cursed.
- Clearly marked player and selected/targeted people; no outlines or special effects reveal unconfirmed possession.
- Existing compact investigator dashboard remains visible while the map and UI receive a restrained neon-noir polish.
- Exactly 100 residents total: 1 player, 19 other cursed NPCs, and 80 civilians.
- Hidden NPC identity: ordinary appearance does not reveal cursed status.
- Three playable curse archetypes picked at game start: The Echo, The Witness, and The Confession.
- A selected target must fulfill the player's curse setup actions before curse use.
- A curse that kills a civilian also kills the player; only cursed kills fulfill that night's requirement.
- Failing to kill a cursed person by dawn ends the run.
- Persistent case notebook that groups witness statements, a suspect's own alibi, independent location records and direct observations by person; contradictory alibis are highlighted. Statements are not necessarily truthful, but recorded events are consistent and cross-checkable.
- Offline, deterministic NPC social simulation: individual traits, human needs, fears, demon drives, private memories, beliefs and relationships.
- NPCs plan to investigate, follow, negotiate, mislead, warn, work or hunt using their **own** perceived information rather than privileged hidden identity data.
- Witnessed NPC actions generate permanent notes, while investigations, rumors and trust changes update NPC knowledge independently of world truth.
- Rival encounters now generate actor/target event logs at dawn, with civilian backfire consequences. This is an **abstract prototype resolution**, not complete curse-condition combat.
- New games have different seeds; append `?seed=12345` to the GitHub Pages URL to replay exactly the same procedural starting scenario.
- Pre-night activity events, seeded local leads, and abstract nightly attrition.
- Synthesized atmospheric tones and cue effects using Web Audio, no copyrighted external audio. The visual effects are generated in Canvas; there are no third-party art assets.
- Single self-contained HTML for easy iteration.

## Visual mode

Open the game at `https://sypark-us.github.io/guess_who/` and look for the **v0.9.0 • HONG KONG NOIR** label. Use `Ctrl+Shift+R` to bypass stale page caching. The updated renderer is in `graphics.js`, with versioned script URLs.

- Graphics are procedurally drawn pixel art with no image downloads or external dependencies.
- Canvas animation is capped at roughly 15 fps and respects `prefers-reduced-motion` for CSS transitions; rainfall is cosmetic only.
- Character appearances are deterministic per world seed and ID, with identical appearance rules for demons and civilians.

## Investigation gameplay

- Talk to a nearby person to learn what they witnessed; follow up to ask where they claim to have been.
- Evidence is tied to stable pre-night world events: individuals, locations and times.
- Investigate a named suspect to check an independent record of their location; revisit for an available witness lead.
- If a suspect's alibi contradicts the independent record, a highlighted **CONTRADICTION** appears in the detective notebook.
- Observe someone to record where and with whom you personally saw them; duplicate observations in the same time window provide no new evidence.
- Civilian behavior can look suspicious, and cursed NPCs can behave normally. A suspicious report is never automatic proof of being cursed.
- On desktop, the My Curse and Nearby People panels are compact; the notebook and incidents receive more height.

To run all regression tests with Node.js (no packages required):

```bash
node --test tests/*.test.cjs
```

## Limitations / next work

This is an early **gameplay prototype**, not the complete design: fully validated NPC curse-condition combat, fully realized alliances/betrayals, a persistent save system, multi-location interior navigation, richer procedural curse generation, story content, handcrafted production sprites/interiors, and a fully composed soundtrack are not implemented. Rival NPCs have independent plans and social beliefs, but their lethal conflict still uses an abstract end-of-night probability check rather than the player's exact curse-condition engine. The current scenario contains 20 cursed characters rather than the planned full 100 cursed-plus-civilians world. The visual/audio system uses generated primitives, not delivered hand-drawn sprites or recorded music.

## Rules

1. Cursed killers must eliminate a **cursed** person every night.
2. If a killer's curse kills an innocent civilian, both the civilian and the killer die.
3. Each kill belongs to the actual curse caster, not all alliance partners.
4. The last remaining cursed person wins.
5. Cursed identities are not distinguished by appearance.

## Recommended next milestone

Tie rival attack attempts to the same exact curse-action validator used by the player; add proper time-scoped conversations, investigation menus, alliance negotiations, tile pathfinding and contextual object interactions. Build a separate handcrafted story mode in a `deathnote/` area only after story and ending design are approved.
