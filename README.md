# alexgosleep — Alex Zhao's Portfolio

Personal site for **Zhao Lixiuqi (Alex)**: computer engineer, robotics tinkerer, and drummer.  
Live at [alexgosleep.com](https://alexgosleep.com).

![The 3D bedroom](public/portfolio_room.jpg)

## Two ways in

| Path | What you get |
|------|----------------|
| **My Room** (`/diorama`) | Interactive 3D bedroom — click the PC, drums, shelf, phone, or Alex. Noise wakes him up. |
| **My Portfolio** (`/home` → about / projects / contacts) | Fast plain site: résumé, projects, music, contact info. |

![Drum kit hotspot](public/portfolio_drums.jpg)

## What's on the site

- **Landing** — choose the room or the plain portfolio
- **Diorama** — Blender-built room + drum kit (GLB), React Three Fiber scene, hotspots, sound, wake meter; the lights are off while Alex sleeps and fade on when he wakes; free camera (turn all the way round, zoom, slide with right-drag / Shift-drag / W A S D) plus an overview and a drummer's view
- **About** — education (NUS CEG + Machine Intelligence MSc) and robotics experience (Avetics, Hikvision, Continental, TLab IBVS)
- **Projects** — engineering (Autoboat, AR Laser Tag, RTOS car, this site) and music bands, with image galleries
- **Contacts** — email, socials, WeChat QR; like button is session-only (resets on reload)

## Tech stack

- **Next.js 15** (Pages Router) + React 19 + TypeScript
- **React Three Fiber** / Drei / Three.js for the diorama
- **Blender** pipeline under `blender/` (room bake, drum kit export, previews)
- **Swiper** for project/band image carousels
- Deployed on **Vercel**

## Local development

```bash
npm install
npm run dev          # turbopack
# or
npm run dev:classic
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build && npm start   # production build
npm run lint
```

## Project layout

| Path | Role |
|------|------|
| `src/pages/` | Routes (`index`, `diorama`, `home`, `about`, `projects`, `contacts`, …) |
| `src/diorama/` | 3D scene, HUD, hotspots, sounds |
| `src/content/` | Projects, bands, skills data |
| `public/models/` | `room.glb` + `room_night_*.webp` (the same room baked with the lights off), `drumkit.glb`, `alex.glb`, `duvet.glb` |
| `blender/` | Scripts and assets that build/export the room |

Content for the projects page lives in `src/content/projects.ts`. Hotspot card copy is in `src/diorama/hotspots.ts`.

## Deploy

Push to `master` on GitHub; Vercel builds and deploys automatically.

---

Made by Alex Zhao, who should have been asleep hours ago.

## Credits

- Drum sounds: "Muldjord Kit" by Lars Muldjord and the DrumGizmo team ([source](https://github.com/sfzinstruments/DrumGizmo.MuldjordKit)), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The clips in `public/sounds/drums` are mixed from its close and overhead microphones, trimmed and converted to MP3.
- The side snare and the splash cymbal: "Naked Drums" by Wilkinson Audio ([source](https://github.com/sfzinstruments/WilkinsonAudio.NakedDrums)), also licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), mixed from several microphones, trimmed and converted to MP3.
