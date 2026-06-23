import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { classify } from '../shared/linalg.js'
import {
  COL, tube, curveTube, sphere, axisArrow, gridXY, gridFloor, label,
  planeMesh, planeIntersection, disposeObject,
} from '../shared/three-helpers.js'

// ─── formatting ───────────────────────────────────────────────────────────────
const fmt = n => { const r = Math.round(n * 100) / 100; return Object.is(r, -0) ? '0' : String(r) }
const lead = (c, v) => `${c < 0 ? '−' : ''}${fmt(Math.abs(c))}${v}`
const term = (c, v) => `${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))}${v}`

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The quadratic equation: the discriminant and three kinds of roots
// ════════════════════════════════════════════════════════════════════════════

const QUAD_PRESETS = [
  { label: 'Δ > 0 · two real roots',     p: { a: 2, b: 8, c: -10 } },
  { label: 'Δ = 0 · one repeated root',  p: { a: 2, b: 8, c: 8 } },
  { label: 'Δ < 0 · two complex roots',  p: { a: 2, b: 8, c: 10 } },
]

const SY = 0.38 // vertical compression so tall parabolas fit (roots, on y=0, are unaffected)

function quadRoots({ a, b, c }) {
  if (Math.abs(a) < 1e-9) {
    if (Math.abs(b) < 1e-9) return { disc: 0, real: [], kind: 'degenerate' }
    return { disc: 0, real: [-c / b], kind: 'linear' }
  }
  const disc = b * b - 4 * a * c
  if (disc > 1e-9) {
    const s = Math.sqrt(disc)
    return { disc, real: [(-b - s) / (2 * a), (-b + s) / (2 * a)], kind: 'two' }
  }
  if (disc > -1e-9) return { disc, real: [-b / (2 * a)], kind: 'repeated' }
  return { disc, real: [], complex: { re: -b / (2 * a), im: Math.sqrt(-disc) / (2 * Math.abs(a)) }, kind: 'complex' }
}

function parabolaPoints({ a, b, c }) {
  const pts = []
  const xmin = -7.5, xmax = 3.5
  for (let i = 0; i <= 140; i++) {
    const x = xmin + (xmax - xmin) * i / 140
    let y = (a * x * x + b * x + c) * SY
    y = Math.max(-8.2, Math.min(8.2, y))
    pts.push(new THREE.Vector3(x, y, 0.02))
  }
  return pts
}

function QuadraticWidget() {
  const [target, setTarget] = useState(QUAD_PRESETS[0].p)
  const [active, setActive] = useState(0)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridXY(8, 1))
      scene.add(axisArrow([1, 0, 0], 8.4, COL.x))
      scene.add(axisArrow([0, 1, 0], 8.4, COL.y))
      scene.add(label('x', new THREE.Vector3(8.9, 0.55, 0), '#c92a2a'))
      scene.add(label('f(x)', new THREE.Vector3(1.1, 8.7, 0), '#2b8a3e'))
    },
    { target: [-2, 0, 0], camStart: { theta: 0.12, phi: 1.45, r: 13 }, zoom: [8, 20], lockPolar: [1.15, 1.97] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    add(curveTube(parabolaPoints(shown), COL.line1, 0.07))
    const r = quadRoots(shown)
    r.real.forEach(rx => { if (rx >= -7.6 && rx <= 3.6) add(sphere(new THREE.Vector3(rx, 0, 0.06), COL.point, 0.2)) })
    const xv = Math.abs(shown.a) > 1e-6 ? -shown.b / (2 * shown.a) : 0
    let yv = (shown.a * xv * xv + shown.b * xv + shown.c) * SY
    yv = Math.max(-8.2, Math.min(8.2, yv))
    if (xv >= -7.6 && xv <= 3.6) add(sphere(new THREE.Vector3(xv, yv, 0.06), COL.vertex, 0.13))
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const r = quadRoots(target)
  const caseColor = r.disc > 1e-9 ? '#1fd6a6' : r.disc > -1e-9 ? '#c9a4ff' : '#ff6b73'
  const caseText = r.kind === 'two' ? 'Δ > 0  →  two distinct real roots'
    : r.kind === 'repeated' ? 'Δ = 0  →  one repeated real root'
    : r.kind === 'complex' ? 'Δ < 0  →  two complex roots (no x-crossing)'
    : 'a = 0  →  not quadratic'

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        <strong>The parabola</strong> <InlineMath>{'f(x)=ax^2+bx+c'}</InlineMath>. Its real roots are exactly
        where the amber curve crosses the green <InlineMath>{'f(x)=0'}</InlineMath> axis (the teal dots).
        Watch them slide together and then vanish as the discriminant passes through zero.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · vertical axis compressed ×0.38 to fit</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel">
              <div className="hud-eq" style={{ color: '#ffce6b' }}>
                f(x) = {lead(target.a, 'x²')} {term(target.b, 'x')} {term(target.c, '')}
              </div>
              <div className="hud-eq" style={{ color: '#aeb9d6' }}>Δ = b² − 4ac = {fmt(r.disc)}</div>
              <div className="hud-note">
                {r.kind === 'two' && `roots: x = ${fmt(r.real[0])},  ${fmt(r.real[1])}`}
                {r.kind === 'repeated' && `root: x = ${fmt(r.real[0])} (double)`}
                {r.kind === 'complex' && `roots: x = ${fmt(r.complex.re)} ± ${fmt(r.complex.im)} i`}
              </div>
            </div>
            <div className="hud-badge" style={{ background: caseColor, color: '#08121f' }}>{caseText}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {QUAD_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(pr.p); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#e8590c' }} />f(x) = a x² + b x + c</div>
            <SliderRow label="a" k="a" value={target.a} onChange={set} min={-3} max={3} step={0.5} />
            <SliderRow label="b" k="b" value={target.b} onChange={set} min={-10} max={10} step={0.5} />
            <SliderRow label="c" k="c" value={target.c} onChange={set} min={-14} max={14} step={0.5} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Two lines: unique / no / infinite solutions of a 2×2 system
// ════════════════════════════════════════════════════════════════════════════

const LINE_PRESETS = [
  { label: 'Unique  (x+y=4, 2x−y=−1)',      p: { a1: 1, b1: 1, c1: 4, a2: 2, b2: -1, c2: -1 } },
  { label: 'No solution  (x−y=1, 2x−2y=−1)', p: { a1: 1, b1: -1, c1: 1, a2: 2, b2: -2, c2: -1 } },
  { label: 'Infinite  (x−y=1, 2x−2y=2)',    p: { a1: 1, b1: -1, c1: 1, a2: 2, b2: -2, c2: 2 } },
  { label: 'Robot localization',            p: { a1: 3, b1: 1, c1: 9, a2: -1, b2: 2, c2: 2 } },
]

function lineSeg(a, b, c, R = 9) {
  if (Math.abs(b) > 1e-9) return [new THREE.Vector3(-R, (c - a * -R) / b, 0.02), new THREE.Vector3(R, (c - a * R) / b, 0.02)]
  if (Math.abs(a) > 1e-9) { const x = c / a; return [new THREE.Vector3(x, -R, 0.02), new THREE.Vector3(x, R, 0.02)] }
  return null
}

function TwoLinesWidget() {
  const [target, setTarget] = useState(LINE_PRESETS[0].p)
  const [active, setActive] = useState(0)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridXY(8, 1))
      scene.add(axisArrow([1, 0, 0], 8.4, COL.x))
      scene.add(axisArrow([0, 1, 0], 8.4, COL.y))
      scene.add(label('x', new THREE.Vector3(8.9, 0.55, 0), '#c92a2a'))
      scene.add(label('y', new THREE.Vector3(0.6, 8.7, 0), '#2b8a3e'))
    },
    { target: [0, 0, 0], camStart: { theta: 0.13, phi: 1.45, r: 13.5 }, zoom: [8, 20], lockPolar: [1.15, 1.97] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    const s1 = lineSeg(shown.a1, shown.b1, shown.c1)
    const s2 = lineSeg(shown.a2, shown.b2, shown.c2)
    if (s1) add(tube(s1[0], s1[1], COL.line1, 0.06))
    if (s2) add(tube(s2[0], s2[1], COL.line2, 0.06))

    const sol = classify([[shown.a1, shown.b1], [shown.a2, shown.b2]], [shown.c1, shown.c2])
    if (sol.type === 'unique' && Math.abs(sol.x[0]) <= 9 && Math.abs(sol.x[1]) <= 9) {
      add(sphere(new THREE.Vector3(sol.x[0], sol.x[1], 0.08), COL.point, 0.24))
    }
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const sol = classify([[target.a1, target.b1], [target.a2, target.b2]], [target.c1, target.c2])
  const badge = sol.type === 'unique'
    ? { cls: 'badge-unique', txt: `✓ unique:  x = ${fmt(sol.x[0])},  y = ${fmt(sol.x[1])}` }
    : sol.type === 'none'
      ? { cls: 'badge-none', txt: '✗ no solution — parallel lines' }
      : { cls: 'badge-infinite', txt: '∞ infinite solutions — same line' }

  function set(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        Two equations, two lines. The <strong>solution</strong> is where they agree. Three things can happen:
        they cross once, never (parallel), or everywhere (identical).
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · move the sliders to bend the lines</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel">
              <div className="hud-eq" style={{ color: '#ffce6b' }}>{lead(target.a1, 'x')} {term(target.b1, 'y')} = {fmt(target.c1)}</div>
              <div className="hud-eq" style={{ color: '#86b6ff' }}>{lead(target.a2, 'x')} {term(target.b2, 'y')} = {fmt(target.c2)}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {LINE_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(pr.p); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#e8590c' }} />Line 1 · a₁x + b₁y = c₁</div>
            <SliderRow label="a₁" k="a1" value={target.a1} onChange={set} />
            <SliderRow label="b₁" k="b1" value={target.b1} onChange={set} />
            <SliderRow label="c₁" k="c1" value={target.c1} onChange={set} min={-9} max={9} />
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#1c7ed6' }} />Line 2 · a₂x + b₂y = c₂</div>
            <SliderRow label="a₂" k="a2" value={target.a2} onChange={set} />
            <SliderRow label="b₂" k="b2" value={target.b2} onChange={set} />
            <SliderRow label="c₂" k="c2" value={target.c2} onChange={set} min={-9} max={9} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 3 — Three planes in 3D: the 3×3 system meets at a single point
// ════════════════════════════════════════════════════════════════════════════

const PLANE_PRESETS = [
  { label: 'Unique point  (textbook 3×3)', sys: { p: [[1, 1, 2], [2, -1, 1], [1, 0, 4]], d: [7, 0.5, 7] } },
  { label: 'Infinite  (common line)',      sys: { p: [[1, 1, 1], [1, -1, 1], [2, 0, 2]], d: [3, 1, 4] } },
  { label: 'No solution  (parallel pair)', sys: { p: [[1, 1, 1], [1, 1, 1], [1, -1, 0]], d: [2, 5, 0] } },
]
const PLANE_COLORS = [COL.line1, COL.line2, COL.line3]

const flatten = sys => {
  const o = {}
  sys.p.forEach((row, i) => { o['a' + i] = row[0]; o['b' + i] = row[1]; o['c' + i] = row[2]; o['d' + i] = sys.d[i] })
  return o
}
const toPlanes = f => [0, 1, 2].map(i => ({ a: f['a' + i], b: f['b' + i], c: f['c' + i], d: f['d' + i] }))

function ThreePlanesWidget() {
  const [target, setTarget] = useState(flatten(PLANE_PRESETS[0].sys))
  const [active, setActive] = useState(0)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridFloor(7, 1))
      scene.add(axisArrow([1, 0, 0], 6.6, COL.x))
      scene.add(axisArrow([0, 1, 0], 6.6, COL.y))
      scene.add(axisArrow([0, 0, 1], 6.6, COL.z))
      scene.add(label('x₁', new THREE.Vector3(7.1, 0.4, 0), '#c92a2a'))
      scene.add(label('x₂', new THREE.Vector3(0.4, 7.0, 0), '#2b8a3e'))
      scene.add(label('x₃', new THREE.Vector3(0.4, 0.4, 7.1), '#1864ab'))
    },
    { target: [1, 1.5, 1.5], camStart: { theta: 0.7, phi: 1.0, r: 15 }, zoom: [7, 34] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }

    const planes = toPlanes(shown)
    planes.forEach((p, i) => { const m = planeMesh(p.a, p.b, p.c, p.d, PLANE_COLORS[i], 6); if (m) add(m) })

    // Pairwise intersection lines — they all run through the common point.
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) {
      const ln = planeIntersection(planes[i], planes[j])
      if (ln) {
        const A = ln.point.clone().addScaledVector(ln.dir, -8)
        const B = ln.point.clone().addScaledVector(ln.dir, 8)
        add(tube(A, B, COL.guide, 0.028))
      }
    }

    const sol = classify(planes.map(p => [p.a, p.b, p.c]), planes.map(p => p.d))
    if (sol.type === 'unique' && sol.x.every(v => Math.abs(v) <= 9)) {
      add(sphere(new THREE.Vector3(sol.x[0], sol.x[1], sol.x[2]), COL.point, 0.26))
    }
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const planes = toPlanes(target)
  const sol = classify(planes.map(p => [p.a, p.b, p.c]), planes.map(p => p.d))
  const badge = sol.type === 'unique'
    ? { cls: 'badge-unique', txt: `✓ unique:  (${fmt(sol.x[0])}, ${fmt(sol.x[1])}, ${fmt(sol.x[2])})` }
    : sol.type === 'none'
      ? { cls: 'badge-none', txt: '✗ no common point' }
      : { cls: 'badge-infinite', txt: '∞ planes share a whole line' }

  const planeStr = p => `${lead(p.a, 'x₁')} ${term(p.b, 'x₂')} ${term(p.c, 'x₃')} = ${fmt(p.d)}`

  function setD(k, v) { setTarget(t => ({ ...t, [k]: v })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        Three equations in three unknowns are <strong>three planes</strong>. Generically they meet at a single
        point — the teal dot where all three intersection lines cross. Slide the right-hand sides to glide the
        planes; try the degenerate presets to see a shared line (∞) or a missing intersection (none).
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 11.5 }}>
              <div className="hud-eq" style={{ color: '#ffce6b' }}>{planeStr(planes[0])}</div>
              <div className="hud-eq" style={{ color: '#86b6ff' }}>{planeStr(planes[1])}</div>
              <div className="hud-eq" style={{ color: '#ffa6c4' }}>{planeStr(planes[2])}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {PLANE_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(flatten(pr.sys)); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#e8590c' }} />Right-hand sides (translate the planes)</div>
            <SliderRow label="d₁" k="d0" value={target.d0} onChange={setD} min={-4} max={12} step={0.5} />
            <SliderRow label="d₂" k="d1" value={target.d1} onChange={setD} min={-4} max={12} step={0.5} />
            <SliderRow label="d₃" k="d2" value={target.d2} onChange={setD} min={-4} max={12} step={0.5} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── shared little components ─────────────────────────────────────────────────

function SliderRow({ label, k, value, onChange, min = -5, max = 5, step = 0.5 }) {
  return (
    <label className="slider-row">
      <span className="slider-label">{label} = <b>{fmt(value)}</b></span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(k, parseFloat(e.target.value))} />
    </label>
  )
}

function QuizQ({ num, type, question, options, correct, explanation }) {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="quiz-question">
      <div className="quiz-meta"><span className="quiz-num">Q{num}</span><span className="quiz-type">{type}</span></div>
      <p className="quiz-text">{question}</p>
      <div className="quiz-options">
        {options.map((opt, i) => {
          let cls = 'quiz-option'
          if (revealed) { if (i === correct) cls += ' correct'; else if (i === selected) cls += ' wrong' }
          else if (i === selected) cls += ' selected'
          return (
            <button key={i} className={cls} onClick={() => !revealed && setSelected(i)}>
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>{opt}
            </button>
          )
        })}
      </div>
      {!revealed
        ? <button className="submit-btn" disabled={selected === null} onClick={() => setRevealed(true)}>Check Answer</button>
        : <div className={`quiz-feedback ${selected === correct ? 'feedback-correct' : 'feedback-wrong'}`}>
            <strong>{selected === correct ? '✓ Correct!' : '✗ Not quite.'}</strong><p>{explanation}</p>
          </div>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L01() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#fdeaec', color: '#d83a45', borderColor: '#f6c9ce' }}>
          Module 1 · Lecture 1 · Grizzle Ch. 1
        </div>
        <h1 className="lesson-title">Introduction to Systems of Linear Equations</h1>
        <p className="lesson-subtitle">
          A warm-up from algebra, the three things that can happen when you solve, and a 3×3 system painful
          enough by hand to make you crave better tools. This is where computational linear algebra begins.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Almost every problem in robotics, machine learning, and physics turns into the same question:
            <em> find the values that satisfy all of my constraints at the same time.</em> A self-driving car
            fusing sensor readings, a neural network fitting data, a truss holding up a bridge — under the hood,
            each is solving a <strong>system of equations</strong>.
          </p>
          <p>
            Before we get there, recall something you already know: the <strong>quadratic equation</strong>. Even
            this humble equation has <strong>three possible outcomes</strong> when you solve it — two real
            solutions, one repeated solution, or no real solutions at all. The discriminant tells you which.
          </p>
          <p>
            That "three cases" pattern is not a coincidence — it echoes through everything that follows. When we
            move to <strong>linear</strong> equations, the very same trichotomy appears: a system can have a
            <strong> unique solution</strong>, <strong>no solution</strong>, or <strong>infinitely many</strong>.
            Hold onto that idea; it will follow you through the entire course.
          </p>
          <p>
            We will build the intuition geometrically. One equation in two unknowns is a <strong>line</strong>;
            in three unknowns, a <strong>plane</strong>. Solving a system means asking where those lines or
            planes <em>all cross at once</em> — a picture you can literally rotate in the widgets below.
          </p>
        </div>
      </section>

      {/* ── Warm-up: the quadratic ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">WARM-UP · THE QUADRATIC EQUATION</span></h2>
        <div className="content-block">
          <p>A <strong>quadratic equation</strong> in the unknown <InlineMath>{'x'}</InlineMath> is</p>
          <DisplayMath>{'a x^2 + b x + c = 0, \\qquad a \\neq 0,'}</DisplayMath>
          <p>with constants <InlineMath>{'a, b, c'}</InlineMath>. Its solutions are given by the quadratic formula:</p>
          <DisplayMath>{'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}.'}</DisplayMath>
          <p>
            Everything hinges on the quantity under the root, the <strong>discriminant</strong>
            <InlineMath>{'\\;\\Delta := b^2 - 4ac'}</InlineMath>:
          </p>
          <div className="callout">
            <strong>The three cases of a quadratic</strong>
            <ol>
              <li><strong><InlineMath>{'\\Delta > 0'}</InlineMath></strong> — two <em>distinct real</em> roots; the parabola crosses the <InlineMath>{'x'}</InlineMath>-axis twice.</li>
              <li><strong><InlineMath>{'\\Delta = 0'}</InlineMath></strong> — one <em>repeated real</em> root; the parabola just touches the axis.</li>
              <li><strong><InlineMath>{'\\Delta < 0'}</InlineMath></strong> — two <em>complex</em> roots <InlineMath>{'(-b \\pm i\\sqrt{-\\Delta})/2a'}</InlineMath>; the parabola never meets the axis.</li>
            </ol>
            The roots are the values of <InlineMath>{'x'}</InlineMath> where <InlineMath>{'f(x)=ax^2+bx+c'}</InlineMath> equals zero — i.e. where the curve meets the horizontal axis.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · DISCRIMINANT &amp; ROOTS</span></h2>
        <QuadraticWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLES · THREE DISCRIMINANTS</span></h2>
        <div className="content-block">
          <h3>Example 1 — two distinct real roots</h3>
          <p>Solve <InlineMath>{'2x^2 + 8x - 10 = 0'}</InlineMath>. Here <InlineMath>{'a=2,\\,b=8,\\,c=-10'}</InlineMath>.</p>
          <DisplayMath>{'\\Delta = 8^2 - 4(2)(-10) = 64 + 80 = 144 > 0'}</DisplayMath>
          <DisplayMath>{'x = \\frac{-8 \\pm \\sqrt{144}}{4} = \\frac{-8 \\pm 12}{4} = 1 \\ \\text{or}\\ -5.'}</DisplayMath>

          <h3>Example 2 — one repeated root</h3>
          <p>Solve <InlineMath>{'2x^2 + 8x + 8 = 0'}</InlineMath>.</p>
          <DisplayMath>{'\\Delta = 64 - 4(2)(8) = 0 \\;\\Rightarrow\\; x = \\frac{-8 \\pm 0}{4} = -2 \\ (\\text{repeated}).'}</DisplayMath>

          <h3>Example 3 — two complex roots</h3>
          <p>Solve <InlineMath>{'2x^2 + 8x + 10 = 0'}</InlineMath>.</p>
          <DisplayMath>{'\\Delta = 64 - 80 = -16 < 0 \\;\\Rightarrow\\; x = \\frac{-8 \\pm 4i}{4} = -2 \\pm i,'}</DisplayMath>
          <p>
            where <InlineMath>{'i := \\sqrt{-1}'}</InlineMath>. Press each preset in the widget and watch the two
            teal roots slide toward each other (Δ → 0), merge, and then lift off the axis entirely (Δ &lt; 0).
          </p>
        </div>
      </section>

      {/* ── The big idea: linear ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · WHAT &ldquo;LINEAR&rdquo; MEANS</span></h2>
        <div className="content-block">
          <p>
            For the first ten chapters of this course, we deliberately leave the quadratic behind and study
            <strong> linear</strong> equations. An equation is linear when every unknown appears only to the
            <em> first power</em>:
          </p>
          <DisplayMath>{'a_1 x_1 + a_2 x_2 + \\cdots + a_n x_n = b.'}</DisplayMath>
          <p>
            No <InlineMath>{'x^2'}</InlineMath>, no products <InlineMath>{'x_i x_j'}</InlineMath>, no
            <InlineMath>{'\\;\\sin(x)'}</InlineMath>, <InlineMath>{'\\sqrt{x}'}</InlineMath>, or
            <InlineMath>{'\\;e^x'}</InlineMath>. It is perhaps surprising that equations this plain can be so
            powerful — but they are both interesting <em>and</em> important.
          </p>
          <p>Geometrically, a single linear equation carves out a flat object: a line in 2D, a plane in 3D, a hyperplane in <InlineMath>{'\\mathbb{R}^n'}</InlineMath>. A <strong>system</strong> of two equations in two unknowns is</p>
          <DisplayMath>{String.raw`\begin{cases} a_{11}x + a_{12}y = b_1 \\ a_{21}x + a_{22}y = b_2 \end{cases}`}</DisplayMath>
          <p>and "solving" it means finding the <InlineMath>{'(x,y)'}</InlineMath> that lies on <em>both</em> lines simultaneously.</p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · TWO LINES, THREE OUTCOMES</span></h2>
        <TwoLinesWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLES · WHAT CAN HAPPEN</span></h2>
        <div className="content-block">
          <h3>A unique solution</h3>
          <DisplayMath>{String.raw`\begin{cases} x + y = 4 \\ 2x - y = -1 \end{cases}`}</DisplayMath>
          <p><strong>By substitution.</strong> Solve the first for <InlineMath>{'x'}</InlineMath> and substitute:</p>
          <DisplayMath>{String.raw`x = 4 - y \;\Rightarrow\; 2(4-y) - y = -1 \;\Rightarrow\; -3y = -9 \;\Rightarrow\; y = 3,`}</DisplayMath>
          <p>and back-substituting gives <InlineMath>{'x = 4 - 3 = 1'}</InlineMath>.</p>
          <p><strong>By elimination.</strong> Adding the two equations kills <InlineMath>{'y'}</InlineMath> immediately:</p>
          <DisplayMath>{String.raw`(x+y) + (2x - y) = 4 + (-1) \;\Rightarrow\; 3x = 3 \;\Rightarrow\; x = 1,\; y = 3.`}</DisplayMath>
          <p>Both routes give the same answer, written stacked as <InlineMath>{String.raw`\begin{bmatrix} x \\ y \end{bmatrix} = \begin{bmatrix} 1 \\ 3 \end{bmatrix}`}</InlineMath> — the teal dot in the widget.</p>

          <h3>No solution</h3>
          <DisplayMath>{String.raw`\begin{cases} x - y = 1 \\ 2x - 2y = -1 \end{cases}`}</DisplayMath>
          <p>
            The left side of the second equation is exactly twice the first
            (<InlineMath>{'2x-2y = 2(x-y)'}</InlineMath>), but the right sides disagree:
            <InlineMath>{'\\;-1 \\neq 2\\cdot 1'}</InlineMath>. Substituting <InlineMath>{'x = y+1'}</InlineMath> leads to
            the contradiction <InlineMath>{'2 = -1'}</InlineMath>. The equations are <strong>inconsistent</strong> —
            two parallel lines that never meet.
          </p>

          <h3>Infinitely many solutions</h3>
          <DisplayMath>{String.raw`\begin{cases} x - y = 1 \\ 2x - 2y = 2 \end{cases}`}</DisplayMath>
          <p>
            Now the second equation is the first one doubled, right side and all — it adds no new information.
            Substituting gives <InlineMath>{'2 = 2'}</InlineMath>, always true, and <InlineMath>{'y'}</InlineMath> is a
            free parameter: <InlineMath>{'x = y + 1'}</InlineMath> for every <InlineMath>{'y'}</InlineMath>. The two
            lines are <strong>identical</strong>.
          </p>
          <div className="callout callout-success">
            <strong>Summary so far.</strong> For a 2×2 system with constants
            <InlineMath>{'\\;a_{11},a_{12},a_{21},a_{22}'}</InlineMath> and <InlineMath>{'b_1,b_2'}</InlineMath>,
            depending on those constants there is exactly one solution, no solution, or infinitely many — never
            "two" or "five." The same trichotomy as the quadratic, now for lines.
          </div>
        </div>
      </section>

      {/* ── Scaling up: 3×3 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">SCALING UP · NAMING VARIABLES &amp; 3×3</span></h2>
        <div className="content-block">
          <p>
            With two unknowns we happily write <InlineMath>{'x'}</InlineMath> and <InlineMath>{'y'}</InlineMath>; with
            three, <InlineMath>{'x,y,z'}</InlineMath>. But we are aiming at hundreds of unknowns, and the alphabet
            (even with all 24 Greek letters) runs out fast. The only scalable choice is to <em>number</em> them:
          </p>
          <DisplayMath>{'x_1, x_2, x_3, \\dots, x_n.'}</DisplayMath>
          <p>Here is a system of three linear equations in three unknowns:</p>
          <DisplayMath>{String.raw`\begin{cases} x_1 + x_2 + 2x_3 = 7 \\ 2x_1 - x_2 + x_3 = 0.5 \\ x_1 \quad\;\; + 4x_3 = 7 \end{cases}`}</DisplayMath>
          <p>
            Each equation is now a <strong>plane</strong> in three-dimensional space, and a solution is a point that
            lies on all three planes at once. Spin the widget below: three planes generically slice through one
            another at a single shared point.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THREE PLANES IN 3D</span></h2>
        <ThreePlanesWidget />
      </section>

      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · SOLVING THE 3×3</span></h2>
        <div className="content-block">
          <p>The strategy is the same as before: solve for one variable and substitute. The third equation has no <InlineMath>{'x_2'}</InlineMath>, so start there — solve for <InlineMath>{'x_1'}</InlineMath>:</p>
          <DisplayMath>{'x_1 = 7 - 4x_3.'}</DisplayMath>
          <p>Substitute into the first two equations:</p>
          <DisplayMath>{String.raw`\begin{aligned} (7 - 4x_3) + x_2 + 2x_3 &= 7 &&\Rightarrow&\; x_2 - 2x_3 &= 0 \\ 2(7 - 4x_3) - x_2 + x_3 &= 0.5 &&\Rightarrow&\; -x_2 - 7x_3 &= -13.5 \end{aligned}`}</DisplayMath>
          <p>Add the two reduced equations to eliminate <InlineMath>{'x_2'}</InlineMath>:</p>
          <DisplayMath>{String.raw`-9x_3 = -13.5 \;\Rightarrow\; x_3 = 1.5,`}</DisplayMath>
          <p>then back-substitute: <InlineMath>{'x_2 = 2x_3 = 3'}</InlineMath> and <InlineMath>{'x_1 = 7 - 4(1.5) = 1'}</InlineMath>.</p>
          <DisplayMath>{String.raw`\begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} = \begin{bmatrix} 1 \\ 3 \\ 1.5 \end{bmatrix}.`}</DisplayMath>
          <div className="callout callout-warning">
            <strong>Tedium ⟹ Motivation.</strong> That was a slog for just three equations. Four is worse; a
            hundred by hand is hopeless — and "hundreds of variables with confidence" is exactly this course's
            four-week goal. The pain is the point: it motivates the matrix machinery that makes this routine.
          </div>
          <p>
            One more warning case. The system <InlineMath>{'x = 1,\\; y = 2,\\; x + y = a'}</InlineMath> has
            <em> three</em> equations but only two unknowns. It is consistent only when
            <InlineMath>{'\\;a = 3'}</InlineMath>; for any other <InlineMath>{'a'}</InlineMath> there is no solution.
            <strong> More equations than unknowns</strong> usually means no solution — a situation we will tame
            later with least squares.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            We need a way to tell — <em>quickly, without grinding through substitution</em> — whether a system
            lands in the nice unique-solution case or one of the problematic ones. Getting there requires a few
            new tools, which the next lectures build:
          </p>
          <ul style={{ paddingLeft: 22, marginTop: 4 }}>
            <li>what <strong>matrices</strong> and <strong>vectors</strong> are, and how to package a whole system as <InlineMath>{'A\\mathbf{x} = \\mathbf{b}'}</InlineMath>;</li>
            <li>what it means for a system to be <strong>triangular</strong> or <strong>square</strong>;</li>
            <li>and the <strong>determinant</strong> of a matrix — a single number that flags the unique-solution case at a glance.</li>
          </ul>
          <p style={{ marginTop: 14 }}>That is exactly where <strong>Lecture 2 — Vectors, Matrices &amp; Determinants</strong> picks up.</p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🤖</div>
              <h3>LiDAR Map Building</h3>
              <p>
                Cassie Blue's 32-beam Velodyne returns thousands of points per scan. Stitching scans into one
                map means applying matrices to vectors to align coordinate frames — Project 1 of ROB 101, and a
                direct descendant of solving <InlineMath>{'A\\mathbf{x}=\\mathbf{b}'}</InlineMath>.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📈</div>
              <h3>Precipitation Regression</h3>
              <p>
                Fitting a surface to real NOAA weather data over Alaska (Project 2) is linear regression — an
                <em> overdetermined</em> system with far more equations than unknowns, solved by least squares
                in Chapter 8.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛹</div>
              <h3>Segway Balance Control</h3>
              <p>
                Balancing an inherently unstable two-wheeled robot (Project 3) uses a feedback loop built on
                linear models of the dynamics — stabilizing the system means choosing gains so the linear
                equations behave.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌍</div>
              <h3>Mathematics at the Scale of Life</h3>
              <p>
                The recurring theme: do real math on real datasets — 10,000 LiDAR points, not three toy
                equations. Programming reinforces the math, and the math makes the programming possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quiz ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag quiz-tag">QUIZ</span></h2>
        <div className="content-block">
          <QuizQ
            num={1} type="Conceptual"
            question="For 2x² + 8x + 10 = 0 the discriminant is Δ = −16. What does that tell you?"
            options={[
              'There are two distinct real roots',
              'The parabola never crosses the x-axis; the two roots are complex',
              'The single repeated root is at x = −2',
              'The equation has no roots of any kind',
            ]}
            correct={1}
            explanation="Δ < 0 means √Δ is imaginary, so x = (−8 ± 4i)/4 = −2 ± i. The two roots are complex conjugates and the parabola sits entirely above the x-axis — it never touches y = 0. (Every quadratic still has two roots; here they're just not real.)"
          />
          <QuizQ
            num={2} type="Definition"
            question="Which of these is a LINEAR equation in its unknowns?"
            options={[
              'x₁² + x₂ = 5',
              'sin(x₁) + 3x₂ = 0',
              '3x₁ − 2x₂ + x₃ = 5',
              'x₁ x₂ = 4',
            ]}
            correct={2}
            explanation="Linear means every unknown appears only to the first power, with no products, powers, or transcendental functions. Only 3x₁ − 2x₂ + x₃ = 5 qualifies. The others contain x₁² (a square), sin(x₁) (transcendental), and x₁x₂ (a product) respectively."
          />
          <QuizQ
            num={3} type="Classification"
            question="How many solutions does this system have:  x − y = 1  and  2x − 2y = 2 ?"
            options={[
              'Exactly one solution',
              'No solution — the lines are parallel',
              'Infinitely many — the two equations describe the same line',
              'Exactly two solutions',
            ]}
            correct={2}
            explanation="The second equation is the first multiplied by 2 — right-hand side included. It carries no new information, so the two lines coincide. y is a free parameter and x = y + 1 for every y: infinitely many solutions. (Contrast with 2x − 2y = −1, where the right sides disagree and you get no solution.)"
          />
          <QuizQ
            num={4} type="Transfer"
            question="The system  x = 1,  y = 2,  x + y = a  has three equations but two unknowns. For which a is it consistent?"
            options={[
              'Every value of a',
              'Only a = 3',
              'Only a = 0',
              'No value of a — there are too many equations',
            ]}
            correct={1}
            explanation="The first two equations force x = 1 and y = 2, so x + y = 3. The third equation is satisfiable only if a = 3. For any other a the three constraints contradict each other. This is the typical fate of overdetermined systems (more equations than unknowns): consistent only for special right-hand sides — the motivation for least squares later in the course."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State the discriminant Δ = b² − 4ac from memory and name the three cases it distinguishes.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Name the three outcomes for a linear system and describe each geometrically (lines, then planes) in one sentence.</div>
            <div className="review-item"><span className="review-day">Day 3</span>Re-solve x + y = 4, 2x − y = −1 by both substitution and elimination, without notes. Confirm (1, 3).</div>
            <div className="review-item"><span className="review-day">Day 7</span>Redo the 3×3 example to (1, 3, 1.5) by hand. Notice how much effort three equations took — and imagine a hundred.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain "the three cases" to a friend using only the parabola and the two-lines pictures — no formulas allowed.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
