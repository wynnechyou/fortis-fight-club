# Fortis Fighter

A browser-based 2D fighting game inspired by Street Fighter, where characters are coworkers. Simple mechanics with impactful feel and polish.

## Core gameplay loop

1. Player selects a character (Calvin, Shawn, Steve, or Jing)
2. Face AI opponent in 1v1 combat
3. Attack, block, or use special moves to reduce opponent HP to 0
4. Round ends when one fighter reaches 0 HP
5. (Optional) Best of 3 rounds system

## Characters

- **Calvin** - sprites_calvin.png
- **Shawn** - sprites_shawn.png  
- **Steve** - sprites_steve.png
- **Jing** - sprites_jing.png

Each character has a unique special attack with cooldown.

## Controls

- **A** → Attack
- **S** → Block  
- **D** → Special (has cooldown)
- **Arrow Keys** → Move left/right

## Run locally

```bash
npm install
npm run dev
```

Open the Vite dev server URL (defaults to `http://localhost:5173`).

## Testing

- Character balance: adjust damage values in `data/characters.csv`
- AI behavior: tune in `data/config.csv` or AI logic
- Special cooldowns: modify in character data
- Resetting: refresh the page
