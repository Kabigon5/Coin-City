# ASSET MANIFEST
Coin City: Build Your Future, Chapter One: Budget Bay

Record format per asset: name, purpose, character, location, scene, prompt id
(see HIGGSFIELD_PROMPTS.md), references used, model or tool, selected output,
revision, final or reference-only, where it appears in the game.

## GENERATION LOG
| Asset | Prompt id | Model | Status | Output file | Appears in game |
|---|---|---|---|---|---|
| Key art | H-01 | nano_banana_2 | BLOCKED: connector approval not granted ("No approval received"). Procedural canvas key art shipped as fallback. | assets/keyart.jpg (slot) | Main menu background, loading |
| Instant Everything billboard | H-02 | nano_banana_2 | BLOCKED, procedural canvas ad shipped as fallback | assets/billboard.jpg (slot) | Plaza billboard texture |
| Glitch takeover | H-03 | nano_banana_2 | BLOCKED, procedural glitch canvas shipped as fallback | assets/glitch.jpg (slot) | Billboard and screens during Glitch events |
| Character lineup | H-04 | nano_banana_2 | BLOCKED, in-engine character models are the shipped reference | assets/characters.jpg (slot) | docs, credits screen |
| All video cinematics | H-20 to H-25 | kling3_0_turbo / seedance_2_0 | NOT RUN (credit budget: 110 credits on Plus, video reserved until user approves) | exports/ when produced | Opening, ending, Future Lens, ads, trailer |

Every blocked row has an exact reproducible prompt in HIGGSFIELD_PROMPTS.md.
When a generation is approved and run, update its row: model, revision number,
selected output URL, downloaded file path, and flip status to FINAL or
REFERENCE-ONLY.

## PROCEDURAL ASSETS SHIPPED IN-ENGINE (no external files needed)
| Asset | Tool | Where |
|---|---|---|
| All character models | Three.js primitive rigs, code-built | game/js/characters.js |
| Budget Bay district | Three.js geometry, code-built | game/js/world.js |
| Store signs, posters, murals, clock face, billboard fallback | Canvas 2D textures generated at runtime | game/js/world.js |
| Music, ambience, footsteps, coins, UI, glitch audio | WebAudio synthesis at runtime | game/js/audio.js |

## DROP-IN SLOTS (assets/README.md has details)
The game checks assets/ at startup and swaps procedural art for these files
when present: keyart.jpg, billboard.jpg, glitch.jpg, characters.jpg. No code
changes required.
