# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This project lives in `course/`. The sibling directories `rob101/` and `ilovepdf_split-range/`
are reference material (the original UMich ROB 101 repo and split PDFs of the Grizzle textbook),
not part of the app. Run all commands from `course/`.

## Commands

```bash
npm install        # first-time setup
npm run dev        # Vite dev server with HMR
npm run build      # production build (also the fastest way to verify a lecture compiles)
npm run preview    # serve the production build
```

There is no test suite, linter, or typechecker configured. `npm run build` is the verification gate.

## What this is

An interactive single-page course for **ROB 101: Computational Linear Algebra** (University of
Michigan, Fall 2021, Grizzle). React + Vite SPA; Three.js, React, and KaTeX are bundled from npm.
Each lecture is intuition → 3D widget → formalism → worked example → robotics/ML application →
self-grading quiz. `COURSE_PLAN.md` is the authoritative spec: the 24-lecture syllabus, the
6-section pedagogy arc, the shared color vocabulary, and the per-widget requirements.

## Architecture

The whole app is driven by one registry: **`src/data/curriculum.js`**. It defines `MODULES`
(4 modules, 24 lectures), and each lecture maps an `id` to its React `component`. A lecture whose
`component` is `null` is unbuilt — `LessonView` renders the "coming soon" `Stub` for it. As of
this writing only Module 1, L01–L06, are built; everything else is a stub.

Render path: `App.jsx` holds the active lecture id in state → `Sidebar.jsx` (built from `MODULES`)
selects it → `LessonView.jsx` calls `findLecture(id)` and renders the lecture component or the stub.

### Adding / editing a lecture

1. Create `src/lessons/mN/LXX.jsx` (one self-contained file per lecture).
2. Wire it in `src/data/curriculum.js`: `import LXX from '../lessons/mN/LXX.jsx'` and set that
   lecture's `component: LXX`. **A lecture is invisible until it is wired into the registry.**
3. `npm run build` to confirm it compiles.

Follow the 6-section structure and content fidelity rules in `COURSE_PLAN.md` (PEDAGOGY RULES),
and use an existing built lecture (e.g. `src/lessons/m1/L05.jsx`) as the template. Lessons import
the shared helpers below rather than reinventing primitives.

### Shared lesson toolkit (`src/lessons/shared/`)

Every widget is built from these — reuse them, don't duplicate:

- **`three-helpers.js`** — the `COL` palette (single source of truth for 3D colors), plus geometry
  builders: `tube`, `curveTube`, `sphere`, `axisArrow`, `arrowFromTo`, `parallelogram`,
  `parallelepiped`, `gridXY`, `gridFloor`, `label` (camera-facing sprite), `planeMesh`,
  `planeIntersection`, and `disposeObject`. **Always `disposeObject` a subtree before removing it
  from the scene** to avoid leaking GPU geometry/materials.
- **`useOrbitScene.js`** — `useOrbitScene(buildStatic, opts)` sets up renderer + camera + manual
  orbit controls (no orbit library) + lights + render loop, pauses drawing off-screen via
  IntersectionObserver, and is StrictMode-safe. `buildStatic(scene, ctx)` adds permanent geometry
  once; add/remove per-frame geometry through `ctxRef.current.scene`.
- **`useAnimatedParams.js`** — `useAnimatedParams(target)` eases widget params toward a target so
  geometry glides on preset changes instead of snapping. Note the StrictMode footgun documented in
  the file: the raf handle must be nulled on cleanup or animation freezes after remount.
- **`linalg.js`** — `solveLinear`, `classify`, `det2`, `det3`.
- **`ui.jsx`** — `fmt`/`lead`/`term` number+equation formatting, `SliderRow`, and `QuizQ`
  (self-grading multiple choice).
- **`components/Math.jsx`** — `InlineMath`/`DisplayMath` KaTeX wrappers. They are `memo`-ized so
  60fps widget re-renders never re-run KaTeX; keep TeX source strings static per call site.

### Theming and visual conventions

- The app frame (page + sidebar) is **light with a dark sidebar**, driven by CSS custom properties
  in `:root` of `src/app.css`. The 3D canvases are **light** (`#f4f8fd → #dde7f4` gradient), so the
  3D palette uses saturated/darker tones — pale or neon colors wash out. Two sources of truth for
  color: `COL` in `three-helpers.js` (3D scene) and the CSS vars in `app.css` (prose/HUD). Keep them
  consistent with the table in `COURSE_PLAN.md`.
- Performance is bundle-conscious: `vite.config.js` manually splits `three`, `katex`, and `react`
  into separate chunks. Widgets re-render at ~60fps, which is why Math is memoized and scenes pause
  when scrolled off-screen.
