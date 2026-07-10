# assets/ drop-in slots

The game loads these files at startup if they exist, replacing the built-in
procedural canvas artwork with Higgsfield renders. File names are fixed:

- keyart.jpg      Main menu background. Prompt H-01 in HIGGSFIELD_PROMPTS.md
- billboard.jpg   Instant Everything plaza billboard texture. Prompt H-02
- glitch.jpg      Glitch screen takeover art. Prompt H-03
- characters.jpg  Character lineup, shown on the credits screen. Prompt H-04

Use 16:9 JPG, 1280x720 or larger. Drop the file in this folder and reload the
game. If a file is missing the game silently keeps its procedural fallback,
so nothing ever appears broken.
