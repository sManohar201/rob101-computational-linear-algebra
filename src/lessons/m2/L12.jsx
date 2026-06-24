import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, gridFloor, label,
  arrowFromTo, planeMesh, disposeObject,
} from '../shared/three-helpers.js'

const v3 = a => new THREE.Vector3(a[0], a[1], a[2])
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = a => Math.sqrt(dot(a, a))

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The dot product is an angle meter
//  Two vectors in the plane, each set by an angle and a length. The HUD shows
//  u·v = ‖u‖‖v‖cosθ; the badge flips to "orthogonal" exactly when u·v = 0
//  (a right angle). The orange bar is the projection of v onto u.
// ════════════════════════════════════════════════════════════════════════════

const ANGLE_PRESETS = [
  { label: 'Right angle → u·v = 0', p: { t1: 25, t2: 115, r1: 4, r2: 3.5 } },
  { label: 'Aligned → u·v maximal', p: { t1: 40, t2: 40, r1: 4, r2: 3 } },
  { label: 'Opposed → u·v negative', p: { t1: 30, t2: 210, r1: 3.5, r2: 3 } },
  { label: 'Book pair (3,4) ⊥ (−7/3,7/4)', p: { t1: 53.13, t2: 143.13, r1: 5, r2: 2.917 } },
]

const RA = 6
function gridZ0(half = RA, color = 0x9fb0c9) {
  const pts = []
  for (let i = -half; i <= half + 1e-6; i++) {
    pts.push(new THREE.Vector3(-half, i, 0), new THREE.Vector3(half, i, 0))
    pts.push(new THREE.Vector3(i, -half, 0), new THREE.Vector3(i, half, 0))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 }))
}

function AngleWidget() {
  const [target, setTarget] = useState(ANGLE_PRESETS[0].p)
  const [active, setActive] = useState(0)
  const shown = useAnimatedParams(target)
  const dyn = useRef([])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridZ0())
      scene.add(axisArrow([1, 0, 0], RA + 0.4, COL.x))
      scene.add(axisArrow([0, 1, 0], RA + 0.4, COL.y))
      scene.add(label('x', new THREE.Vector3(RA + 0.7, -0.4, 0), '#c92a2a'))
      scene.add(label('y', new THREE.Vector3(-0.5, RA + 0.7, 0), '#2b8a3e'))
    },
    {
      target: [0, 0, 0],
      camStart: { theta: 0, phi: Math.PI / 2, r: 15 },
      zoom: [9, 24], lockPolar: [1.2, 1.94],
    }
  )

  const uv = p => {
    const a1 = p.t1 * Math.PI / 180, a2 = p.t2 * Math.PI / 180
    return {
      u: [p.r1 * Math.cos(a1), p.r1 * Math.sin(a1), 0],
      v: [p.r2 * Math.cos(a2), p.r2 * Math.sin(a2), 0],
    }
  }

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)
    const { u, v } = uv(shown)
    const U = v3(u), V = v3(v)

    add(arrowFromTo(O, U, COL.line2, 0.05))
    add(arrowFromTo(O, V, COL.vertex, 0.05))
    add(label('u', U.clone().multiplyScalar(1.1), '#1c7ed6', 0.5))
    add(label('v', V.clone().multiplyScalar(1.12), '#6741d9', 0.5))

    // projection of v onto u:  (u·v / u·u) u  — the orange "shadow" of v on u
    const uu = dot(u, u)
    if (uu > 1e-6) {
      const c = dot(u, v) / uu
      const proj = U.clone().multiplyScalar(c)
      add(tube(proj, V, COL.guide, 0.025))          // the perpendicular drop
      add(arrowFromTo(O, proj, COL.line1, 0.04))    // the projection vector itself
      add(sphere(proj, COL.line1, 0.1))
    }
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps

  const { u, v } = uv(target)
  const d = dot(u, v)
  const nu = norm(u), nv = norm(v)
  const cos = nu * nv > 1e-9 ? d / (nu * nv) : 0
  const deg = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI
  const ortho = Math.abs(d) < 0.03
  const badge = ortho
    ? { cls: 'badge-unique', txt: '⟂ orthogonal — u·v = 0, a right angle' }
    : d > 0
      ? { cls: 'badge-infinite', txt: `acute · u·v = ${fmt(d)} > 0` }
      : { cls: 'badge-none', txt: `obtuse · u·v = ${fmt(d)} < 0` }

  function set(k, val) { setTarget(t => ({ ...t, [k]: val })); setActive(-1) }

  return (
    <div className="widget">
      <p className="widget-caption">
        The <strong>dot (inner) product</strong> <InlineMath>{'u\\cdot v = \\sum_k u_k v_k = u^{\\top}v'}</InlineMath>
        collapses two vectors into one number that measures how much they <em>align</em>:
        <InlineMath>{'\\;u\\cdot v = \\lVert u\\rVert\\,\\lVert v\\rVert\\cos\\theta'}</InlineMath>. It is positive for an
        acute angle, negative for obtuse, and <strong>exactly zero when the vectors are perpendicular</strong>. The orange
        arrow is the projection (shadow) of <InlineMath>{'v'}</InlineMath> onto <InlineMath>{'u'}</InlineMath>; it
        vanishes precisely when <InlineMath>{'\\;u\\cdot v = 0'}</InlineMath>.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · slide the angles to hunt for a right angle</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#4dabf7' }}>‖u‖ = {fmt(nu)}</div>
              <div className="hud-eq" style={{ color: '#9775fa' }}>‖v‖ = {fmt(nv)}</div>
              <div className="hud-eq">u·v = {fmt(d)}</div>
              <div className="hud-note">angle θ = {fmt(deg)}°  ·  cos θ = {fmt(cos)}</div>
            </div>
            <div className={`hud-badge ${badge.cls}`}>{badge.txt}</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {ANGLE_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${active === i ? 'active' : ''}`}
              onClick={() => { setTarget(pr.p); setActive(i) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#1c7ed6' }} />Vector u</div>
            <SliderRow label="angle θ₁ (°)" k="t1" value={target.t1} onChange={set} min={0} max={360} step={1} />
            <SliderRow label="length r₁" k="r1" value={target.r1} onChange={set} min={0.5} max={5.5} step={0.1} />
          </div>
          <div className="controls-col">
            <div className="controls-label"><span className="swatch" style={{ background: '#6741d9' }} />Vector v</div>
            <SliderRow label="angle θ₂ (°)" k="t2" value={target.t2} onChange={set} min={0} max={360} step={1} />
            <SliderRow label="length r₂" k="r2" value={target.r2} onChange={set} min={0.5} max={5.5} step={0.1} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Gram-Schmidt, one orthogonal vector at a time
//  Step through vₖ = uₖ − Σ projections. The faint grey arrows are the inputs uₖ;
//  the solid arrows are the orthogonal vᵢ built so far; for the current step the
//  orange "shadow" pₖ = uₖ − vₖ is shown being subtracted off, and the previous
//  span (line/plane) is drawn so you can see vₖ pop out perpendicular to it.
// ════════════════════════════════════════════════════════════════════════════

const GS_PRESETS = [
  { label: 'Grizzle Ex. 9.18 (basis of ℝ³)', U: [[1, 1, 0], [1, 2, 3], [0, 1, 1]] },
  { label: 'Two vectors (Ex. 9.17)',          U: [[1, 1, 1], [1, -1, 2]] },
  { label: 'Already orthogonal → unchanged',  U: [[2.5, 0, 0], [0, 3, 0], [0, 0, 2]] },
]

const GS_COLORS = [COL.line1, COL.line2, COL.vertex]

function gramSchmidt(U) {
  const V = []
  const projsPerStep = []
  U.forEach(u => {
    let v = [...u]
    const proj = [0, 0, 0]
    V.forEach(vi => {
      const c = dot(u, vi) / dot(vi, vi)
      for (let i = 0; i < 3; i++) { v[i] -= c * vi[i]; proj[i] += c * vi[i] }
    })
    V.push(v)
    projsPerStep.push(proj) // pₖ = uₖ − vₖ (sum of shadows on earlier vᵢ)
  })
  return { V, projsPerStep }
}

function GramSchmidtWidget() {
  const [idx, setIdx] = useState(0)
  const U = GS_PRESETS[idx].U
  const [step, setStep] = useState(U.length)
  const [normed, setNormed] = useState(false)
  const dyn = useRef([])
  const { V, projsPerStep } = gramSchmidt(U)

  // clamp step when switching presets with fewer vectors
  useEffect(() => { setStep(GS_PRESETS[idx].U.length) }, [idx])

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridFloor(6, 1))
      scene.add(axisArrow([1, 0, 0], 6.2, COL.x))
      scene.add(axisArrow([0, 1, 0], 6.2, COL.y))
      scene.add(axisArrow([0, 0, 1], 6.2, COL.z))
      scene.add(label('x₁', new THREE.Vector3(6.7, 0.4, 0), '#c92a2a'))
      scene.add(label('x₂', new THREE.Vector3(0.4, 6.6, 0), '#2b8a3e'))
      scene.add(label('x₃', new THREE.Vector3(0.4, 0.4, 6.7), '#1864ab'))
    },
    { target: [0, 0.4, 0], camStart: { theta: 0.7, phi: 0.95, r: 16 }, zoom: [8, 36] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)
    const k = step - 1 // current index being built

    // the input vectors, faint, up to the current step
    U.slice(0, step).forEach(u => add(arrowFromTo(O, v3(u), COL.guide, 0.03)))

    // the previous span (what vₖ must become perpendicular to)
    if (k === 1) {
      const d = v3(V[0]).normalize()
      add(tube(d.clone().multiplyScalar(-7), d.clone().multiplyScalar(7), COL.guide, 0.02))
    } else if (k === 2) {
      const a = v3(V[0]), b = v3(V[1])
      const nrm = a.clone().cross(b)
      const pm = planeMesh(nrm.x, nrm.y, nrm.z, 0, COL.guide, 5.5, 0.12); if (pm) add(pm)
    }

    // the orthogonal vectors built so far
    for (let i = 0; i < step; i++) {
      const out = normed ? v3(V[i]).normalize().multiplyScalar(3) : v3(V[i])
      add(arrowFromTo(O, out, GS_COLORS[i], 0.055))
      add(sphere(out, GS_COLORS[i], 0.13))
      add(label(normed ? `q${i + 1}` : `v${i + 1}`, out.clone().multiplyScalar(1.12), '#1b2434', 0.46))
    }

    // for the current step (k ≥ 1), show the shadow pₖ being subtracted from uₖ
    if (k >= 1 && !normed) {
      const uk = v3(U[k]), vk = v3(V[k]), pk = v3(projsPerStep[k])
      add(arrowFromTo(O, pk, COL.line1, 0.038))                 // projection pₖ
      add(label('proj', pk.clone().multiplyScalar(1.1), '#e8590c', 0.42))
      add(tube(pk, uk, COL.guide, 0.02))                        // pₖ → uₖ
      add(tube(vk, uk, COL.guide, 0.02))                        // vₖ → uₖ  (vₖ = uₖ − pₖ)
    }
  }, [idx, step, normed]) // eslint-disable-line react-hooks/exhaustive-deps

  // orthogonality check for the HUD
  const built = V.slice(0, step)
  const dotsOk = built.every((vi, i) => built.every((vj, j) => i >= j || Math.abs(dot(vi, vj)) < 1e-6))

  return (
    <div className="widget">
      <p className="widget-caption">
        <strong>Gram–Schmidt</strong> turns any independent set into an <strong>orthogonal</strong> one spanning the same
        subspace. Keep the first vector, then make each next vector perpendicular to all the earlier ones by subtracting
        its <em>shadow</em> on them: <InlineMath>{'\\;v_k = u_k - \\sum_{i<k}\\dfrac{u_k\\cdot v_i}{v_i\\cdot v_i}\\,v_i'}</InlineMath>.
        Step through it: grey arrows are the inputs <InlineMath>{'u_k'}</InlineMath>, the orange arrow is the shadow being
        removed, and the colored arrow <InlineMath>{'v_k'}</InlineMath> pops out perpendicular to the faint previous span.
      </p>
      <p className="widget-instructions">drag to orbit · scroll to zoom · step through the process, then normalize to an orthonormal basis</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">{normed ? 'orthonormal basis {q₁…}' : `building v${step}`}</div>
              {built.map((v, i) => (
                <div key={i} className="hud-eq" style={{ color: ['#e8590c', '#1c7ed6', '#6741d9'][i], fontSize: 11 }}>
                  v{i + 1} = ({fmt(v[0])}, {fmt(v[1])}, {fmt(v[2])})
                </div>
              ))}
            </div>
            <div className={`hud-badge ${dotsOk ? 'badge-unique' : 'badge-none'}`}>
              {dotsOk ? '✓ all built vectors mutually orthogonal (vᵢ·vⱼ = 0)' : 'not yet orthogonal'}
            </div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {GS_PRESETS.map((pr, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setNormed(false) }}>{pr.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label">Gram–Schmidt steps</div>
            <div className="preset-bar" style={{ marginTop: 0 }}>
              {U.map((_, i) => (
                <button key={i} className={`preset-btn ${step === i + 1 ? 'active' : ''}`}
                  onClick={() => { setStep(i + 1); setNormed(false) }}>v{i + 1}</button>
              ))}
              <button className={`preset-btn ${normed ? 'active' : ''}`}
                onClick={() => { setStep(U.length); setNormed(n => !n) }}>
                {normed ? 'show vᵢ' : 'normalize → qᵢ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L12() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#e9f0ff', color: '#2563eb', borderColor: '#c9dbf6' }}>
          Module 2 · Lecture 12 · Grizzle Ch. 9 §9.5–9.7
        </div>
        <h1 className="lesson-title">The Dot Product, Orthonormal Vectors &amp; Gram–Schmidt</h1>
        <p className="lesson-subtitle">
          One number — the <strong>dot product</strong> — encodes the angle between two vectors and generalizes the right
          angle to <InlineMath>{'\\mathbb{R}^n'}</InlineMath> for any <InlineMath>{'n'}</InlineMath>. Vectors that meet at
          right angles are the "nicest" possible basis, and the <strong>Gram–Schmidt process</strong> manufactures them
          from any independent set — the engine behind next lecture's QR factorization.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Some bases are awkward and some are a joy. The <InlineMath>{'x'}</InlineMath>-, <InlineMath>{'y'}</InlineMath>-,
            <InlineMath>{'\\;z'}</InlineMath>-axes are a joy because they are mutually <strong>perpendicular</strong> and
            unit length: to find a vector's <InlineMath>{'x'}</InlineMath>-coordinate you just read it off, no solving
            required. Skewed, stretched axes force you to untangle the coordinates with a linear solve every time.
          </p>
          <p>
            The dot product is what lets us <em>detect</em> perpendicularity with arithmetic instead of a protractor —
            and it works in dimensions we cannot picture. Can you imagine a right angle in
            <InlineMath>{'\\;\\mathbb{R}^{27}'}</InlineMath>? Neither can your instructors; but
            <InlineMath>{'\\;u\\cdot v = 0'}</InlineMath> tells you it is there all the same.
          </p>
          <p>
            And if we are handed an ugly, skewed set of independent vectors, we need not live with it. Gram–Schmidt
            straightens it: keep the first vector, then sweep away from each subsequent vector its "shadow" on the ones
            already fixed, leaving a clean set of mutually perpendicular vectors that span the very same subspace.
          </p>
        </div>
      </section>

      {/* ── Formalism: dot product ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · DOT PRODUCT &amp; ORTHOGONALITY</span></h2>
        <div className="content-block">
          <p>
            For <InlineMath>{'u, v\\in\\mathbb{R}^n'}</InlineMath>, the <strong>dot product</strong> (also called the
            <strong> inner product</strong>) is
          </p>
          <DisplayMath>{String.raw`u\cdot v := \sum_{k=1}^{n} u_k v_k = u^{\top} v.`}</DisplayMath>
          <p>
            It connects to length and angle through two identities:
            <InlineMath>{'\\;\\lVert v\\rVert^2 = v\\cdot v'}</InlineMath> and
            <InlineMath>{'\\;u\\cdot v = \\lVert u\\rVert\\,\\lVert v\\rVert\\cos\\theta'}</InlineMath>, where
            <InlineMath>{'\\;\\theta'}</InlineMath> is the angle between them. The geometric payoff is the definition that
            extends to every dimension:
          </p>
          <div className="callout callout-success">
            <strong>Orthogonality.</strong> <InlineMath>{'u'}</InlineMath> and <InlineMath>{'v'}</InlineMath> are
            <strong> orthogonal</strong> (at right angles), written <InlineMath>{'u\\perp v'}</InlineMath>, exactly when
            <DisplayMath>{String.raw`u\cdot v = u^{\top}v = 0.`}</DisplayMath>
          </div>
          <p>
            A set <InlineMath>{'\\{v_1,\\dots,v_k\\}'}</InlineMath> is <strong>orthogonal</strong> if
            <InlineMath>{'\\;v_i\\cdot v_j = 0'}</InlineMath> for all <InlineMath>{'i\\neq j'}</InlineMath>, and
            <strong> orthonormal</strong> if additionally each <InlineMath>{'\\lVert v_i\\rVert = 1'}</InlineMath>. To
            normalize, just divide by the length: <InlineMath>{'\\;\\bar v = v/\\lVert v\\rVert'}</InlineMath> has
            <InlineMath>{'\\;\\lVert\\bar v\\rVert = 1'}</InlineMath>.
          </p>
          <div className="callout callout-info">
            <strong>Orthogonal ⇒ independent.</strong> A set of nonzero orthogonal vectors is automatically linearly
            independent. (Dot both sides of <InlineMath>{'\\;\\sum_i\\alpha_i v_i = 0'}</InlineMath> with
            <InlineMath>{'\\;v_j'}</InlineMath>: every cross term dies, leaving
            <InlineMath>{'\\;\\alpha_j\\lVert v_j\\rVert^2 = 0'}</InlineMath>, so <InlineMath>{'\\alpha_j = 0'}</InlineMath>.)
            Orthogonality is independence with no wiggle room.
          </div>
          <p>
            The <strong>Pythagorean theorem</strong> survives too: if
            <InlineMath>{'\\;w_1\\perp w_2'}</InlineMath> then
            <InlineMath>{'\\;\\lVert w_1 + w_2\\rVert^2 = \\lVert w_1\\rVert^2 + \\lVert w_2\\rVert^2'}</InlineMath>,
            because the cross term <InlineMath>{'\\;2\\,w_1\\cdot w_2'}</InlineMath> in the expansion is zero.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE DOT PRODUCT AS AN ANGLE METER</span></h2>
        <AngleWidget />
      </section>

      {/* ── Worked example 9.14 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 9.14 (WHO IS ORTHOGONAL?)</span></h2>
        <div className="content-block">
          <p>
            Which pairs among <InlineMath>{String.raw`u = \begin{bmatrix} 2 \\ 1 \\ -1\end{bmatrix}`}</InlineMath>,
            <InlineMath>{String.raw`\;v = \begin{bmatrix} 1 \\ 3 \\ 5\end{bmatrix}`}</InlineMath>,
            <InlineMath>{String.raw`\;w = \begin{bmatrix} -5 \\ 0 \\ 1\end{bmatrix}`}</InlineMath> are orthogonal?
          </p>
          <DisplayMath>{String.raw`u\cdot v = (2)(1)+(1)(3)+(-1)(5) = 0, \quad u\cdot w = (2)(-5)+0+(-1)(1) = -11, \quad v\cdot w = (1)(-5)+0+(5)(1) = 0.`}</DisplayMath>
          <p>
            So <InlineMath>{'u\\perp v'}</InlineMath> and <InlineMath>{'v\\perp w'}</InlineMath>, but
            <InlineMath>{'\\;u\\not\\perp w'}</InlineMath>. Orthogonality is a pairwise property — it does not chain.
          </p>
          <p>
            To make the orthogonal pair <InlineMath>{'\\{u,v\\}'}</InlineMath> <em>orthonormal</em>, divide by the lengths
            <InlineMath>{'\\;\\lVert u\\rVert = \\sqrt{6}'}</InlineMath> and
            <InlineMath>{'\\;\\lVert v\\rVert = \\sqrt{35}'}</InlineMath>:
            <InlineMath>{String.raw`\;\bar u = \tfrac{1}{\sqrt6}(2,1,-1)`}</InlineMath>,
            <InlineMath>{String.raw`\;\bar v = \tfrac{1}{\sqrt{35}}(1,3,5)`}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Formalism: orthogonal matrices + Gram-Schmidt ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · ORTHOGONAL MATRICES &amp; GRAM–SCHMIDT</span></h2>
        <div className="content-block">
          <p>
            Stack orthonormal vectors as the columns of a matrix <InlineMath>{'Q'}</InlineMath> and something magical
            happens. Because column <InlineMath>{'i'}</InlineMath> dotted with column <InlineMath>{'j'}</InlineMath> is
            <InlineMath>{'\\;1'}</InlineMath> when <InlineMath>{'i=j'}</InlineMath> and <InlineMath>{'0'}</InlineMath>
            otherwise, <InlineMath>{'\\;Q^{\\top}Q = I'}</InlineMath>.
          </p>
          <div className="callout callout-success">
            <strong>Orthogonal matrix.</strong> A square <InlineMath>{'n\\times n'}</InlineMath> matrix
            <InlineMath>{'\\;Q'}</InlineMath> whose columns are orthonormal satisfies
            <DisplayMath>{String.raw`Q^{\top}Q = I_n = Q\,Q^{\top} \quad\Longrightarrow\quad Q^{-1} = Q^{\top}.`}</DisplayMath>
            Its inverse is just its transpose — the <em>second</em> (and last) inverse formula worth memorizing. A
            rectangular tall <InlineMath>{'Q'}</InlineMath> with orthonormal columns ("orthonormal matrix") still gives
            <InlineMath>{'\\;Q^{\\top}Q = I'}</InlineMath>, and <InlineMath>{'\\det(Q)=\\pm1'}</InlineMath> for the square
            case.
          </div>
          <p>
            How do we <em>build</em> orthonormal vectors? Start from any independent set
            <InlineMath>{'\\;\\{u_1,\\dots,u_m\\}'}</InlineMath> and run <strong>Gram–Schmidt</strong>:
          </p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\begin{aligned} v_1 &= u_1, \\ v_k &= u_k - \sum_{i=1}^{k-1}\left(\frac{u_k\cdot v_i}{v_i\cdot v_i}\right) v_i, \quad k = 2,\dots,m. \end{aligned}`}</DisplayMath>
            The result <InlineMath>{'\\{v_1,\\dots,v_m\\}'}</InlineMath> is <strong>orthogonal</strong> and
            <strong> span-preserving</strong>: <InlineMath>{'\\;\\operatorname{span}\\{v_1,\\dots,v_k\\} = \\operatorname{span}\\{u_1,\\dots,u_k\\}'}</InlineMath>
            for every <InlineMath>{'k'}</InlineMath>. Normalize each <InlineMath>{'v_i'}</InlineMath> to get an
            <strong> orthonormal basis</strong>.
          </div>
          <p>
            Each term <InlineMath>{String.raw`\left(\frac{u_k\cdot v_i}{v_i\cdot v_i}\right) v_i`}</InlineMath> is precisely
            the projection of <InlineMath>{'u_k'}</InlineMath> onto an earlier direction — the orange shadow in the widget
            below. Subtract all of them and what remains is perpendicular to everything before it.
          </p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · GRAM–SCHMIDT STEP BY STEP</span></h2>
        <GramSchmidtWidget />
      </section>

      {/* ── Worked example 9.18 ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · GRIZZLE 9.18 (ORTHONORMAL BASIS OF ℝ³)</span></h2>
        <div className="content-block">
          <p>
            Apply Gram–Schmidt to the basis
            <InlineMath>{String.raw`\;u_1 = (1,1,0),\; u_2 = (1,2,3),\; u_3 = (0,1,1)`}</InlineMath>.
          </p>
          <DisplayMath>{String.raw`v_1 = u_1 = \begin{bmatrix} 1 \\ 1 \\ 0\end{bmatrix}, \qquad v_1\cdot v_1 = 2.`}</DisplayMath>
          <DisplayMath>{String.raw`v_2 = u_2 - \frac{u_2\cdot v_1}{v_1\cdot v_1}\,v_1 = \begin{bmatrix} 1 \\ 2 \\ 3\end{bmatrix} - \frac{3}{2}\begin{bmatrix} 1 \\ 1 \\ 0\end{bmatrix} = \begin{bmatrix} -\tfrac12 \\ \tfrac12 \\ 3\end{bmatrix}, \qquad v_2\cdot v_2 = \tfrac{19}{2}.`}</DisplayMath>
          <DisplayMath>{String.raw`v_3 = u_3 - \frac{u_3\cdot v_1}{v_1\cdot v_1}\,v_1 - \frac{u_3\cdot v_2}{v_2\cdot v_2}\,v_2 = \begin{bmatrix} -\tfrac{6}{19} \\ \tfrac{6}{19} \\ -\tfrac{2}{19}\end{bmatrix}.`}</DisplayMath>
          <p>
            A quick check confirms <InlineMath>{'v_1\\cdot v_2 = v_1\\cdot v_3 = v_2\\cdot v_3 = 0'}</InlineMath>.
            Normalizing gives the orthonormal basis
            <InlineMath>{String.raw`\;\bar v_1 = \tfrac{\sqrt2}{2}(1,1,0)`}</InlineMath>,
            <InlineMath>{String.raw`\;\bar v_2 = \tfrac{\sqrt{38}}{38}(-1,1,6)`}</InlineMath>,
            <InlineMath>{String.raw`\;\bar v_3 = \tfrac{\sqrt{19}}{19}(-3,3,-1)`}</InlineMath> — exactly the columns of the
            <InlineMath>{'\\;Q'}</InlineMath> we will assemble in the next lecture. Tedious by hand, instant in Julia.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <p>
            Gram–Schmidt on the columns of a matrix <InlineMath>{'A'}</InlineMath> yields the
            <strong> QR factorization</strong> <InlineMath>{'\\;A = QR'}</InlineMath>: an orthonormal
            <InlineMath>{'\\;Q'}</InlineMath> (the <InlineMath>{'\\bar v_i'}</InlineMath> above) and an upper-triangular
            <InlineMath>{'\\;R = Q^{\\top}A'}</InlineMath> recording how the original columns rebuild from the orthonormal
            ones. That is the most numerically robust route to solving
            <InlineMath>{'\\;Ax = b'}</InlineMath>, and the entire subject of Lecture 13.
          </p>
          <p>
            One caution we will revisit: the <em>classical</em> Gram–Schmidt shown here behaves poorly under round-off
            error on a computer. A tiny rearrangement — the <strong>Modified Gram–Schmidt</strong> algorithm — produces
            the same vectors in exact arithmetic but stays accurate in floating point. When you have the right algorithm,
            the world is a marvelous place.
          </p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🧭</div>
              <h3>IMU Axis Alignment</h3>
              <p>
                A gyro's three sensing axes are supposed to be orthonormal. Real hardware is slightly skewed; the
                nonzero dot products between measured axes quantify the misalignment that calibration must correct.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Rotation Matrices</h3>
              <p>
                Every rigid-body orientation is an orthogonal matrix <InlineMath>{'R'}</InlineMath> with
                <InlineMath>{'\\;R^{\\top}R = I'}</InlineMath> and <InlineMath>{'\\det R = +1'}</InlineMath>. Inverting an
                orientation is free — just transpose.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛰️</div>
              <h3>Orthonormal Bases for Estimation</h3>
              <p>
                Kalman filters and SLAM keep state in well-conditioned, near-orthonormal coordinates. Gram–Schmidt (via
                QR) re-orthogonalizes drifting bases so numerical errors don't snowball.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Orthogonal Features in ML</h3>
              <p>
                Decorrelating (orthogonalizing) input features speeds up and stabilizes training. The dot product is the
                similarity score at the heart of attention, kernels, and embeddings.
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
            num={1} type="Computational"
            question="What is the dot product of u = (2, 1, −1) and v = (1, 3, 5)?"
            options={[
              '0 — they are orthogonal',
              '10',
              '−11',
              '√6 · √35',
            ]}
            correct={0}
            explanation="u·v = (2)(1) + (1)(3) + (−1)(5) = 2 + 3 − 5 = 0. A zero dot product means u ⟂ v: the vectors meet at a right angle even though we cannot easily picture it."
          />
          <QuizQ
            num={2} type="Conceptual"
            question="Why is a set of nonzero orthogonal vectors automatically linearly independent?"
            options={[
              'Because they all have length 1',
              'Dotting Σαᵢvᵢ = 0 with vⱼ kills every cross term, forcing αⱼ‖vⱼ‖² = 0, so αⱼ = 0',
              'Because orthogonal vectors are always the standard axes',
              'It is not true — orthogonal vectors can be dependent',
            ]}
            correct={1}
            explanation="Take Σαᵢvᵢ = 0 and dot with vⱼ. Orthogonality zeroes all i≠j terms, leaving αⱼ(vⱼ·vⱼ) = 0. Since vⱼ ≠ 0, vⱼ·vⱼ > 0, so αⱼ = 0 for every j — the only combination giving 0 is the trivial one."
          />
          <QuizQ
            num={3} type="Geometric"
            question="In Gram–Schmidt, what exactly is the 'shadow' subtracted from uₖ to form vₖ?"
            options={[
              'The longest of the earlier vectors',
              'The projection of uₖ onto the span of the earlier vᵢ — Σ (uₖ·vᵢ)/(vᵢ·vᵢ) vᵢ',
              'The average of all earlier vectors',
              'A random perpendicular vector',
            ]}
            correct={1}
            explanation="vₖ = uₖ − Σ (uₖ·vᵢ)/(vᵢ·vᵢ) vᵢ. The subtracted sum is the projection of uₖ onto the already-built orthogonal directions. Removing that shadow leaves the part of uₖ perpendicular to all of them."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Q is a square matrix with orthonormal columns. What is Q⁻¹?"
            options={[
              'It must be computed by Gaussian elimination',
              'Qᵀ — the transpose, because QᵀQ = I',
              'Q itself',
              'Q does not have an inverse',
            ]}
            correct={1}
            explanation="Orthonormal columns mean QᵀQ = I, and for a square Q also QQᵀ = I, so Q⁻¹ = Qᵀ. Inverting an orthogonal matrix is free — just transpose it. This is the second of the only two inverse formulas worth memorizing."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write the dot-product definition, the orthogonality test u·v = 0, and the Gram–Schmidt formula for v₂ and v₃ from memory.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) compute (1,0,−1)·(0,1,0). (b) Normalize w = (−5,0,1).</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo Grizzle 9.18 without notes: orthogonalize (1,1,0), (1,2,3), (0,1,1) and check v₁·v₂ = 0.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why QᵀQ = I for orthonormal columns, and why that makes Q⁻¹ = Qᵀ.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain Gram–Schmidt to a friend using only the widget — the shadow being subtracted off, no formulas.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
