# HIGGSFIELD PROMPTS
Coin City: Build Your Future, Chapter One: Budget Bay
Production-ready prompt library. Every prompt below can be pasted directly into
Higgsfield. Where the MCP connector is used, the model field is noted.

Connector status: Higgsfield MCP is connected. A live call was attempted and
blocked with "No approval received" (per-call user approval was not granted in
chat). Balance at time of check: 110 credits, Plus plan. Recommended spend
order given that budget: images 1 through 4 in the Immediate Batch first, video
only if the user tops up.

## GLOBAL STYLE BLOCK
Append to every image and video prompt to keep the project visually consistent:

"Original stylized 3D animation look for a family adventure game. Rounded
toy-like shapes, clean silhouettes, hand painted texture feel, soft shadows,
warm saturated palette of teal #2FA5A9, coral #FF8A5C, sunshine gold #FFC94D,
mint #9FE2BF and cream #FFF4E0, gentle rim light, expressive but simple faces,
no photorealism, no real brands, no watermark."

## GLOBAL NEGATIVE PROMPT
"photorealistic, gritty, horror, weapons, real logos, text artifacts, extra
fingers, distorted faces, watermark, signature, adult content, gambling imagery"

## CHARACTER MASTER DESCRIPTIONS (paste into any prompt featuring them)
- GRANDPA LEDGER: kind man in his 70s, medium brown skin, short curly white
  hair and white beard, flat gray cap, mustard cardigan over plaid shirt,
  brown work pants, carpenter pencil behind ear, sturdy build, warm smile.
- PENNY: bank teller in her mid 20s, light tan skin, black hair in a neat low
  bun with two gold coin shaped hair pins, mint green vest over white shirt,
  navy skirt, round glasses, bright helpful expression.
- MILO: 13 year old boy, deep brown skin, short twist hair dyed blue at the
  tips, oversized orange hoodie with a lightning patch, headphones around neck,
  mismatched colorful sneakers, excitable grin.
- NIA: bakery owner around 30, dark brown skin, rose pink headscarf, flour
  dusted denim apron over yellow shirt, rolled sleeves, gold hoop earrings,
  confident tired-but-determined expression.
- DEX: loan salesman around 35, pale skin, slicked back black hair, thin
  mustache, shiny violet suit with a coin shaped lapel pin, holds a tablet,
  easy salesman smile that never reaches his eyes.
- NOVA: 17 year old content creator, light brown skin, lavender space buns,
  cropped denim jacket covered in enamel pins, phone on a small gimbal, LED
  ring light clipped to her backpack, bright confident pose.
- MAYOR MINT: cheerful mayor in her 50s, olive skin, silver bob haircut, mint
  green suit with a tiny city-skyline pin, sash reading BUDGET BAY, hopeful
  wide smile.
- THE GLITCH: digital figure made of scattered neon cyan and magenta pixel
  fragments forming a shifting theater mask, body dissolving into static, a
  broken coin symbol flickering on its chest, appears only on screens.
- THE PLAYER (default look for marketing only, in-game is customizable):
  12 year old kid, warm tan skin, short dark curly hair, teal jacket, orange
  backpack, rolled jeans, red sneakers.

## IMMEDIATE BATCH (run first when approval is granted)
These four are wired into the game as drop-in files, see assets/README.md.

### H-01 Key art (menu background). Model: nano_banana_2, 16:9
"Promotional key art for the game COIN CITY: BUILD YOUR FUTURE. Large playful
rounded title text COIN CITY at the top with smaller subtitle BUILD YOUR
FUTURE. A small waterfront city district at golden hour seen from a low hill:
a pink bakery with striped awning, a mint green community bank with a glowing
coin sign, a brick clock tower, string lights between lamp posts, a canal with
a little arched bridge, distant giant purple billboard reading INSTANT
EVERYTHING. Foreground: THE PLAYER seen from behind looking at the city, one
hand on backpack strap. Hopeful, warm, inviting." + GLOBAL STYLE BLOCK
File: assets/keyart.jpg

### H-02 Instant Everything billboard advertisement. Model: nano_banana_2, 16:9
"Glossy in-world advertisement billboard for the fictional corporation INSTANT
EVERYTHING. Bold clean headline text: GET IT NOW. PAY LATER. Tiny unreadable
fine print at the bottom edge. Hypnotic purple to electric blue gradient,
shiny gift boxes and gadgets raining down around a giant glowing golden BUY
button pressed by a smiling white glove, confetti of tiny coins, slightly
too-perfect corporate cheerfulness with a subtle sinister undertone."
+ GLOBAL STYLE BLOCK. File: assets/billboard.jpg

### H-03 The Glitch screen takeover. Model: nano_banana_2, 16:9
"THE GLITCH appearing on a hacked public city screen. Shifting mask of neon
cyan and magenta pixel fragments, one eye a spinning broken coin, VHS
scanlines, datamosh smears at the edges, dark navy background full of
corrupted falling coin symbols, mysterious and mischievous rather than scary,
suitable for a kids animated game, no text." + GLOBAL STYLE BLOCK
File: assets/glitch.jpg

### H-04 Main character lineup reference sheet. Model: nano_banana_2, 16:9
"Character lineup reference sheet, eight characters standing in a row on a
flat neutral warm gray background, full body, even studio lighting, consistent
proportions and shared art style, small name label under each: GRANDPA LEDGER,
PENNY, MILO, NIA, DEX, NOVA, MAYOR MINT, and THE PLAYER." Insert all character
master descriptions above. + GLOBAL STYLE BLOCK. File: assets/characters.jpg

## CHARACTER REFERENCE SET (one generation per line, model nano_banana_2)
- H-05 Turnarounds, one per main character, 16:9: "[CHARACTER MASTER
  DESCRIPTION]. Character turnaround sheet: front view, three quarter view,
  side view, back view, standing in a neutral pose, flat neutral background,
  consistent height markers." + GLOBAL STYLE BLOCK
- H-06 Facial expression sheets, one per main character, 1:1: "[CHARACTER
  MASTER DESCRIPTION]. Facial expression sheet, three by three grid of the
  same face: happy, worried, thinking, surprised, laughing, determined,
  embarrassed, skeptical, celebrating. Neutral background." + GLOBAL STYLE BLOCK
- H-07 Outfit variants for the player, 16:9: "THE PLAYER standing in five
  outfit variants side by side: starter teal jacket, rain poncho, cafe apron
  uniform, bakery apron uniform, celebration outfit with a paper party hat."
  + GLOBAL STYLE BLOCK

## ENVIRONMENT REFERENCE SET (model nano_banana_2 unless noted)
- H-08 Budget Bay BEFORE restoration, 16:9: "Wide establishing shot of Budget
  Bay main street in the struggling era: boarded shopfronts, faded mural of a
  sunrise, cracked sidewalk, flickering neon sign, empty flower beds, litter,
  a broken bench, old INSTANT EVERYTHING posters peeling off walls, overcast
  cool light, still charming underneath the neglect." + GLOBAL STYLE BLOCK
- H-09 Budget Bay AFTER restoration, 16:9: "The exact same Budget Bay main
  street fully restored at golden hour: repainted sunrise mural, repaired
  sidewalk, glowing warm shop windows, outdoor cafe seating, planted flower
  beds, string lights, street performer with a guitar, families walking,
  bunting between lamp posts." + GLOBAL STYLE BLOCK (chain from H-08 as an
  image reference for a true before-and-after pair)
- H-10 Player building exterior, before and after, two frames, 16:9
- H-11 Player building interior: "Cozy small studio interior, mattress in a
  corner, wooden desk with a planning corkboard, storage shelf, dusty boarded
  storefront window at the front, single hanging bulb, motes of dust in a
  light shaft, fixer-upper charm." + GLOBAL STYLE BLOCK
- H-12 Nia's bakery interior: "Colorful small bakery interior, glass display
  case of pastel pastries, chalkboard price menu, pink and cream tiles, warm
  hanging lamps, flour in the air, NIA behind the counter." + GLOBAL STYLE BLOCK
- H-13 Penny's Community Bank interior: "Friendly small-town bank interior,
  two wooden teller desks, mint green walls, a digital display showing a
  growing savings chart, waiting bench, coin-pattern rug, an ATM by the door,
  PENNY at a teller desk." + GLOBAL STYLE BLOCK
- H-14 Community center before and after pair, 16:9
- H-15 Prop sheet: "Game prop reference sheet on neutral background: red
  bicycle with a basket, wooden repair toolbox, grocery basket, piggy bank
  shaped like a small building, bus stop sign, paper bill with a red stamp,
  phone with rounded icons, watering can, paint roller." + GLOBAL STYLE BLOCK
- H-16 Vehicle sheet: "Reference sheet: rounded friendly city bus in teal and
  cream with a coin logo, a small delivery cart, a street sweeper, all toy-like
  proportions, side view." + GLOBAL STYLE BLOCK

## VIDEO SHOT LIST AND STORYBOARDS (model kling3_0_turbo or seedance_2_0)
Camera directions included per shot. Generate stills of key frames first with
nano_banana_2 (start frame and end frame), then drive video with them.

### H-20 Opening cinematic, 12 shots, 60 to 90 seconds total
1. (5s) Slow aerial push-in over bright Coin City at noon, flags, busy market.
   Camera: high crane descend. Caption plate: "Coin City, a few years ago."
2. (5s) Street level dolly past happy small businesses, a baker hands a child
   a bun. Camera: lateral dolly left.
3. (5s) Families in the park, kite in the air, picnic. Camera: static, slight
   push.
4. (5s) A huge glossy purple truck arrives, side reading INSTANT EVERYTHING.
   Camera: low angle, truck fills frame.
5. (5s) Montage of screens lighting up: GET IT NOW. PAY LATER. EVERYONE IS
   APPROVED. Camera: whip pans between billboards.
6. (5s) Doorsteps filling with glossy boxes, neighbors comparing gadgets.
   Camera: doorbell POV, fisheye feel.
7. (5s) Calendar pages flip, envelopes stamped PAYMENT DUE pile up on a
   kitchen table. Camera: top-down, envelopes accumulate in stop-motion rhythm.
8. (4s) A shop owner flips a sign to CLOSED, lights inside go dark. Camera:
   through the window, slow zoom.
9. (4s) The park now: empty flower beds, a broken bench, one kite stuck in a
   tree. Camera: same framing as shot 3 for contrast.
10. (4s) Public screens stutter, colors tear, a coin symbol fractures.
    Camera: handheld shake.
11. (5s) THE GLITCH forms out of the static, tilts its mask, taps the glass
    from inside the screen. Camera: slow push to extreme close-up.
12. (6s) A teal bus rolls into Budget Bay at morning, doors hiss open, sneakers
    step down, the player looks up at the district. Camera: starts on wheels,
    tilts up to reveal. Match-cut to gameplay.
Audio: bright music decaying into minor key, ad jingles, paper shuffles, glitch
static, then a hopeful single piano note on shot 12. Two spoken lines max.

### H-21 Chapter ending cinematic, 6 shots, 30 to 40 seconds
Lantern-lit plaza celebration, crane up over restored district, every screen
snaps to static, THE GLITCH: "One district down. The rest of Coin City is
still playing my game." Rapid glimpses of five locked districts: SAVINGS
SPRINGS (waterfalls and vaults), CREDIT CANYON (rope bridges over a ledger
canyon), INVESTMENT ISLAND (lighthouse of charts), BUSINESS BOULEVARD (neon
market street), SCAM STREET (crooked alley of too-good signs). Title card:
NEXT STOP: SAVINGS SPRINGS.

### H-22 Future Lens sequence, 20 seconds
"World freezes and desaturates, glowing teal clockwork rings expand from the
player's phone, two translucent timelines branch down the street: on the left
the same street one year later thriving with a small business glowing, on the
right the same street with red PAYMENT DUE papers drifting like leaves.
Floating coin counters tick up and down over each branch. Camera orbits the
player 180 degrees." + GLOBAL STYLE BLOCK

### H-23 Instant Everything commercial, 15 seconds, plays on in-game screen
"Fake TV commercial: relentlessly cheerful. A gray tired town, a finger
presses a giant golden BUY button, the town explodes into color and products
rain from the sky, everyone dances with boxes, mascot white glove winks,
slogan sung: WHY WAIT? INSTANT EVERYTHING. Final frame: one second of dense
unreadable fine print." + GLOBAL STYLE BLOCK

### H-24 Glitch billboard takeover, 8 seconds
"City billboard playing the Instant Everything ad suddenly tears into static,
THE GLITCH's mask assembles from the pixels, it leans out of the frame,
looks directly at camera, and the screen snaps to a broken coin symbol."

### H-25 Promotional trailer, 45 seconds
Shots: bus arrival, free-roam run through plaza, entering the bakery, coin
counter going up during a cafe shift, Future Lens branch effect, storefront
renovation timelapse, business opening with a small crowd, glitch takeover
tease, key art end card with title. Text cards: "EXPLORE BUDGET BAY",
"EARN IT", "SAVE IT", "GROW IT", "OUTSMART THE GLITCH", "COIN CITY: BUILD
YOUR FUTURE". Music: upbeat, one bass drop on the glitch tease.

## LOGGING RULE
Every generation actually run must be recorded in ASSET_MANIFEST.md with:
asset name, purpose, character, location, scene, exact prompt, references
used, model, selected output, revision number, final or reference-only, and
where it appears in the game.
