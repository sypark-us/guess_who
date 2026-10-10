# CURSED 100: Hong Kong

A neon-noir browser prototype for a supernatural deduction survival game, set in Mong Kok, Hong Kong.

## Play locally

Open `index.html` in a modern desktop browser. No build tool, packages, or internet connection are required.

**Controls:** WASD or arrow keys to move; click a walkable tile to move one step; E selects the nearest visible person; click entries in the Nearby panel to select. Use Talk, Observe, Investigate, Set Target, Use Curse, and Advance to Dawn buttons.

Enable music through **Sound: On** after entering the game (browser audio requires a user gesture).

## Current prototype

- English-only interface with an isolated translation dictionary for future localization (`en`, later `ko` and `zh-HK`).
- 24x17 tile rendered 2D Hong Kong district, simulated player movement, neon building sprites and character silhouettes.
- Exactly 100 residents total: 1 player, 19 other cursed NPCs, and 80 civilians.
- Hidden NPC identity: ordinary appearance does not reveal cursed status.
- Three playable curse archetypes picked at game start: The Echo, The Witness, and The Confession.
- A selected target must fulfill the player's curse setup actions before curse use.
- A curse that kills a civilian also kills the player; only cursed kills fulfill that night's requirement.
- Failing to kill a cursed person by dawn ends the run.
- Notebook for suspect markings and unverified evidence; investigations can generate misleading clues.
- Lightweight off-screen NPC movement and abstract nightly attrition.
- Synthesized atmospheric tones and cue effects using Web Audio, no copyrighted external audio.
- Single self-contained HTML for easy iteration.

## Limitations / next work

This is an early **gameplay prototype**, not the complete design: automatic rival curse planning, actual collaboration/betrayal mechanics, a persistent save system, multi-location interior navigation, richer procedural curse generation, story content, production pixel assets, and fully composed soundtrack are not implemented. NPC curse combat is represented by an abstract nightly simulation. The current scenario contains 20 cursed characters rather than the planned full 100 cursed-plus-civilians world. The visual/audio system uses generated primitives, not delivered hand-drawn sprites or recorded music.

## Rules

1. Cursed killers must eliminate a **cursed** person every night.
2. If a killer's curse kills an innocent civilian, both the civilian and the killer die.
3. Each kill belongs to the actual curse caster, not all alliance partners.
4. The last remaining cursed person wins.
5. Cursed identities are not distinguished by appearance.

## Recommended next milestone

Build a more complete NPC intent planner and event ledger, validate curse feasibility/escape signals with automated tests, and add actual tile pathfinding and contextual object interactions.
