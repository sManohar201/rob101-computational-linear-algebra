import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, arrowFromTo, gridFloor, label, planeMesh, disposeObject,
} from '../shared/three-helpers.js'

const f2 = n => { const r = Math.round(n * 100) / 100; return (Object.is(r, -0) ? 0 : r).toFixed(2) }

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Hyperplane, half-spaces, and signed distance
//  H = {x : a·(x − x_c) = 0}. The normal a splits ℝ³ into H⁺ (a·(x−x_c)>0) and
//  H⁻. Drag a query point and read its SIGNED distance a·(x−x_c)/‖a‖.
// ════════════════════════════════════════════════════════════════════════════

const HP_PRESETS = [
  { label: 'Tilted plane', ax: 1, ay: 1, az: 1, px: 2, py: 1.5, pz: 0.5 },
  { label: 'Horizontal (a = ẑ)', ax: 0, ay: 0, az: 1, px: 1, py: 1, pz: 2 },
  { label: 'On the plane', ax: 1, ay: -1, az: 0.5, px: 0, py: 0, pz: 0 },
  { label: 'Far on H⁻ side', ax: 1, ay: 1, az: 1, px: -2.5, py: -2, pz: -1.5 },
]
const XC = [0, 0, 0] // hyperplane passes through origin offset x_c

function HyperplaneWidget() {
  const [idx, setIdx] = useState(0)
  const [params, setParams] = useState({ px: 2, py: 1.5, pz: 0.5 })
  const dyn = useRef([])
  const P = HP_PRESETS[idx]
  const shown = useAnimatedParams(params)
  const a = [P.ax, P.ay, P.az]
  const na = Math.hypot(...a)
  const q = [shown.px, shown.py, shown.pz]
  const raw = a[0] * (q[0] - XC[0]) + a[1] * (q[1] - XC[1]) + a[2] * (q[2] - XC[2])
  const signed = raw / na
  const side = signed > 0.05 ? 'H⁺' : signed < -0.05 ? 'H⁻' : 'on H'

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridFloor(6, 1))
      scene.add(axisArrow([1, 0, 0], 5, COL.x))
      scene.add(axisArrow([0, 1, 0], 5, COL.y))
      scene.add(axisArrow([0, 0, 1], 5, COL.z))
    },
    { target: [0, 0, 0], camStart: { theta: 0.7, phi: 1.0, r: 15 }, zoom: [8, 26] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    // the hyperplane a·(x − x_c) = 0  ⇒  a·x = a·x_c
    const d = a[0] * XC[0] + a[1] * XC[1] + a[2] * XC[2]
    add(planeMesh(a[0], a[1], a[2], d, COL.line2, 4.5, 0.28))
    // normal vector a (unit) from x_c
    const ah = new THREE.Vector3(...a).normalize()
    const C = new THREE.Vector3(...XC)
    add(arrowFromTo(C, C.clone().add(ah.clone().multiplyScalar(2.2)), COL.line1, 0.045))
    add(label('a (normal)', C.clone().add(ah.clone().multiplyScalar(2.4)), '#d9480f', 0.42))
    // query point
    const Q = new THREE.Vector3(...q)
    add(sphere(Q, signed >= 0 ? COL.point : COL.line3, 0.18))
    add(label('x', Q.clone().add(new THREE.Vector3(0.25, 0.25, 0)), signed >= 0 ? '#0c8599' : '#c2255c', 0.45))
    // foot of perpendicular = projection onto the plane
    const foot = Q.clone().addScaledVector(ah, -signed)
    add(tube(Q, foot, COL.guide, 0.025))
    add(sphere(foot, COL.vertex, 0.1))
  }, [idx, shown.px, shown.py, shown.pz]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="widget">
      <p className="widget-caption">
        A <strong>hyperplane</strong> in <InlineMath>{'\\mathbb{R}^n'}</InlineMath> is the flat
        <InlineMath>{'\\;(n-1)'}</InlineMath>-dimensional set <InlineMath>{'\\;\\{x : a\\cdot(x-x_c)=0\\}'}</InlineMath> —
        everything perpendicular to the normal <InlineMath>{'\\;a'}</InlineMath> through the offset
        <InlineMath>{'\\;x_c'}</InlineMath>. It cuts space into two <strong>half-spaces</strong>. The value
        <InlineMath>{'\\;a\\cdot(x-x_c)/\\lVert a\\rVert'}</InlineMath> is the <strong>signed distance</strong>: positive on
        the side the normal points to (<InlineMath>{'H^+'}</InlineMath>), negative on the other
        (<InlineMath>{'H^-'}</InlineMath>), zero on the plane.
      </p>
      <p className="widget-instructions">drag to orbit · move the query point across the plane · watch the sign flip</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">a = ({a.join(', ')}) · ‖a‖ = {f2(na)}</div>
              <div className="hud-eq" style={{ color: '#ffb066' }}>x = ({f2(q[0])}, {f2(q[1])}, {f2(q[2])})</div>
              <div className="hud-note">a·(x − x_c) = {f2(raw)}</div>
              <div className="hud-note">signed distance = {f2(signed)}</div>
            </div>
            <div className={`hud-badge ${side === 'H⁺' ? 'badge-unique' : side === 'H⁻' ? 'badge-none' : 'badge-infinite'}`}>
              {side === 'on H' ? 'on the hyperplane (distance 0)' : `${side} side · |distance| = ${f2(Math.abs(signed))}`}
            </div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {HP_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setParams({ px: p.px, py: p.py, pz: p.pz }) }}>{p.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <SliderRow label="x₁" k="px" value={params.px} min={-3} max={3} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, px: v }))} />
            <SliderRow label="x₂" k="py" value={params.py} min={-3} max={3} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, py: v }))} />
            <SliderRow label="x₃" k="pz" value={params.pz} min={-3} max={3} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, pz: v }))} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Orthogonal projection onto a subspace
//  Project x₀ onto the plane V = span{v₁, v₂}. The error x₀ − x* is ⟂ V, and the
//  Pythagorean theorem ‖x₀‖² = ‖x*‖² + ‖x₀ − x*‖² holds.
// ════════════════════════════════════════════════════════════════════════════

const V1 = [1, 0, 0.4], V2 = [0, 1, 0.3] // basis of the projection plane
const PROJ_PRESETS = [
  { label: 'Generic point', x: 2, y: 1.5, z: 2.4 },
  { label: 'Far above plane', x: 0.5, y: 0.5, z: 3 },
  { label: 'Almost in plane', x: 2, y: 1, z: 1.1 },
]
const dot3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2]

function ProjectionWidget() {
  const [idx, setIdx] = useState(0)
  const [params, setParams] = useState({ x: 2, y: 1.5, z: 2.4 })
  const dyn = useRef([])
  const shown = useAnimatedParams(params)
  const x0 = [shown.x, shown.y, shown.z]
  // normal of the plane span{V1,V2}
  const n = [
    V1[1] * V2[2] - V1[2] * V2[1],
    V1[2] * V2[0] - V1[0] * V2[2],
    V1[0] * V2[1] - V1[1] * V2[0],
  ]
  const nn = dot3(n, n)
  const t = dot3(x0, n) / nn
  const xstar = [x0[0] - t * n[0], x0[1] - t * n[1], x0[2] - t * n[2]] // projection onto plane
  const err = [x0[0] - xstar[0], x0[1] - xstar[1], x0[2] - xstar[2]]
  const perpCheck = Math.abs(dot3(err, V1)) + Math.abs(dot3(err, V2))

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridFloor(6, 1))
      scene.add(axisArrow([1, 0, 0], 5, COL.x))
      scene.add(axisArrow([0, 1, 0], 5, COL.y))
      scene.add(axisArrow([0, 0, 1], 5, COL.z))
    },
    { target: [0, 0, 0], camStart: { theta: 0.7, phi: 1.0, r: 15 }, zoom: [8, 26] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const O = new THREE.Vector3(0, 0, 0)
    // the subspace V (plane through origin)
    add(planeMesh(n[0], n[1], n[2], 0, COL.line2, 4, 0.22))
    add(label('V = span{v₁,v₂}', new THREE.Vector3(3.4, 0, 1.4), '#1c7ed6', 0.4))
    // x0, projection x*, error (orthogonal)
    const X0 = new THREE.Vector3(...x0), XS = new THREE.Vector3(...xstar)
    add(arrowFromTo(O, X0, 0xb5740a, 0.04))
    add(label('x₀', X0.clone().add(new THREE.Vector3(0.2, 0.2, 0)), '#9c6608', 0.45))
    add(arrowFromTo(O, XS, COL.point, 0.04))
    add(label('x*', XS.clone().add(new THREE.Vector3(0.2, -0.2, 0)), '#0c8599', 0.45))
    add(tube(X0, XS, COL.line3, 0.03)) // error vector ⟂ V
    add(label('x₀ − x* ⟂ V', X0.clone().lerp(XS, 0.5).add(new THREE.Vector3(0.25, 0, 0)), '#c2255c', 0.38))
    add(sphere(XS, COL.point, 0.12))
  }, [idx, shown.x, shown.y, shown.z]) // eslint-disable-line react-hooks/exhaustive-deps

  const n0 = dot3(x0, x0), ns = dot3(xstar, xstar), ne = dot3(err, err)
  return (
    <div className="widget">
      <p className="widget-caption">
        The <strong>orthogonal projection</strong> of <InlineMath>{'x_0'}</InlineMath> onto a subspace
        <InlineMath>{'\\;V'}</InlineMath> is the closest point <InlineMath>{'\\;x^{*}\\in V'}</InlineMath>. Its signature:
        the error <InlineMath>{'\\;x_0 - x^{*}'}</InlineMath> is <strong>perpendicular to all of</strong>
        <InlineMath>{'\\;V'}</InlineMath> (rose), and the Pythagorean theorem
        <InlineMath>{'\\;\\lVert x_0\\rVert^2 = \\lVert x^{*}\\rVert^2 + \\lVert x_0 - x^{*}\\rVert^2'}</InlineMath> holds.
        This is the geometry hiding inside least squares.
      </p>
      <p className="widget-instructions">drag to orbit · move x₀ · the rose error stays perpendicular to the plane</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq" style={{ color: '#ffb066' }}>x₀ = ({f2(x0[0])}, {f2(x0[1])}, {f2(x0[2])})</div>
              <div className="hud-eq">x* = ({f2(xstar[0])}, {f2(xstar[1])}, {f2(xstar[2])})</div>
              <div className="hud-note">⟂ check: (x₀−x*)·v₁,₂ = {f2(perpCheck)} ≈ 0</div>
              <div className="hud-note">‖x₀‖² {f2(n0)} = ‖x*‖² {f2(ns)} + ‖e‖² {f2(ne)}</div>
            </div>
            <div className="hud-badge badge-unique">x* = argmin ‖x₀ − x‖ over x ∈ V</div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {PROJ_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setParams({ x: p.x, y: p.y, z: p.z }) }}>{p.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <SliderRow label="x₀·x" k="x" value={params.x} min={-3} max={3} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, x: v }))} />
            <SliderRow label="x₀·y" k="y" value={params.y} min={-3} max={3} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, y: v }))} />
            <SliderRow label="x₀·z" k="z" value={params.z} min={-3} max={3} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, z: v }))} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L22() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#f3eefe', color: '#7c3aed', borderColor: '#ddd0fb' }}>
          Module 4 · Lecture 22 · Grizzle Ch. 13 §13.1–13.2, §13.4
        </div>
        <h1 className="lesson-title">Affine Spaces, Hyperplanes &amp; Orthogonal Projection</h1>
        <p className="lesson-subtitle">
          Linear algebra doesn't just solve equations — it <strong>separates</strong> space. A
          <strong> hyperplane</strong> is a flat boundary that splits <InlineMath>{'\\mathbb{R}^n'}</InlineMath> into two
          half-spaces, and the <strong>signed distance</strong> to it tells you which side a point is on and how far. The
          companion idea, <strong>orthogonal projection</strong>, is the geometry beneath least squares.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            A line divides a sheet of paper into two sides; a plane divides a room. In
            <InlineMath>{'\\;\\mathbb{R}^n'}</InlineMath> the analog is a <strong>hyperplane</strong>: one dimension less
            than the whole space, slicing it into two <strong>half-spaces</strong>. Every hyperplane has a
            <strong> normal</strong> vector pointing perpendicular to it; the question "which side is this point on?" is
            answered by a single dot product with that normal.
          </p>
          <p>
            Closely related: given a point off a subspace, what is the closest point <em>on</em> it? Drop a perpendicular.
            That foot of the perpendicular is the <strong>orthogonal projection</strong>, and the leftover — the error —
            sticks straight out of the subspace. This single picture is why the least-squares normal equations look the way
            they do.
          </p>
        </div>
      </section>

      {/* ── Formalism: hyperplanes ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · HYPERPLANES &amp; HALF-SPACES</span></h2>
        <div className="content-block">
          <p>In <InlineMath>{'\\mathbb{R}^2'}</InlineMath> any line is the zero set
            <InlineMath>{'\\;\\{(x_1,x_2): a_0 + a_1x_1 + a_2x_2 = 0\\}'}</InlineMath> (this form even captures vertical
            lines, where slope is infinite). A <strong>hyper-subspace</strong>
            <InlineMath>{'\\;N\\subset\\mathbb{R}^n'}</InlineMath> of dimension <InlineMath>{'n-1'}</InlineMath> is the null
            space of one non-zero row: <InlineMath>{'\\;N = \\{x : a\\cdot x = 0\\}'}</InlineMath>. Translate it by
            <InlineMath>{'\\;x_c'}</InlineMath> to get a <strong>hyperplane</strong>:</p>
          <div className="callout callout-info">
            <DisplayMath>{String.raw`H := x_c + N = \{x\in\mathbb{R}^n : a\cdot(x - x_c) = 0\}.`}</DisplayMath>
            The function <InlineMath>{'\\;y(x) = a\\cdot(x - x_c)'}</InlineMath> splits space into the two half-spaces
            <DisplayMath>{String.raw`H^+ = \{x : a\cdot(x - x_c) > 0\}, \qquad H^- = \{x : a\cdot(x - x_c) < 0\}.`}</DisplayMath>
            <InlineMath>{'H^+'}</InlineMath> is the side the normal points toward (acute angle with
            <InlineMath>{'\\;a'}</InlineMath>); <InlineMath>{'H^-'}</InlineMath> the other.
          </div>
        </div>
      </section>

      {/* ── Formalism: signed distance ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · SIGNED DISTANCE</span></h2>
        <div className="content-block">
          <p>The distance from a point <InlineMath>{'x_0'}</InlineMath> to the hyperplane
            <InlineMath>{'\\;H^0 = \\{x : a\\cdot(x - x_c) = 0\\}'}</InlineMath> is read straight off the same function,
            normalized:</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\text{signed dist}(x_0, H^0) = \frac{a\cdot(x_0 - x_c)}{\lVert a\rVert_2}, \qquad d(x_0, H^0) = \left|\frac{a\cdot(x_0 - x_c)}{\lVert a\rVert_2}\right|.`}</DisplayMath>
            If <InlineMath>{'\\;\\lVert a\\rVert = 1'}</InlineMath> the raw value <InlineMath>{'\\;a\\cdot(x_0-x_c)'}</InlineMath>
            <em> is</em> the signed distance. The <strong>sign</strong> encodes the side; the <strong>magnitude</strong> the
            gap. (This single number becomes the SVM's classification score in the next lecture.)
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · HYPERPLANE &amp; SIGNED DISTANCE</span></h2>
        <HyperplaneWidget />
      </section>

      {/* ── Formalism: projection ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · ORTHOGONAL PROJECTION</span></h2>
        <div className="content-block">
          <p><strong>Orthogonal Projection Theorem.</strong> For a subspace
            <InlineMath>{'\\;V\\subseteq\\mathbb{R}^n'}</InlineMath> and a point <InlineMath>{'x_0'}</InlineMath>, there is a
            unique closest point <InlineMath>{'\\;x^{*}\\in V'}</InlineMath>, characterized by</p>
          <div className="callout callout-info">
            <DisplayMath>{String.raw`x^{*} = \arg\min_{x\in V}\lVert x_0 - x\rVert_2^2 \iff (x_0 - x^{*})\perp V \ \text{and}\ x^{*}\in V.`}</DisplayMath>
            The error <InlineMath>{'\\;x_0 - x^{*}'}</InlineMath> is orthogonal to <em>every</em> vector in
            <InlineMath>{'\\;V'}</InlineMath>, and by Pythagoras
            <InlineMath>{'\\;\\lVert x_0\\rVert^2 = \\lVert x^{*}\\rVert^2 + \\lVert x_0 - x^{*}\\rVert^2'}</InlineMath>.
          </div>
          <p>If the columns of <InlineMath>{'U'}</InlineMath> form a basis of <InlineMath>{'V'}</InlineMath>, write
            <InlineMath>{'\\;x^{*} = U\\alpha'}</InlineMath>; orthogonality of the error gives the
            <strong> normal equations</strong> with the symmetric, invertible <strong>Gram matrix</strong>
            <InlineMath>{'\\;G = U^{\\top}U'}</InlineMath>:</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`U^{\top}U\,\alpha = U^{\top}x_0, \qquad x^{*} = U\alpha.`}</DisplayMath>
            Set <InlineMath>{'\\;U = A'}</InlineMath> and <InlineMath>{'\\;x_0 = b'}</InlineMath> and this is
            <em> exactly</em> least squares <InlineMath>{'\\;A^{\\top}A\\,x^{*} = A^{\\top}b'}</InlineMath>: solving least
            squares <strong>is</strong> projecting <InlineMath>{'\\;b'}</InlineMath> onto the column span of
            <InlineMath>{'\\;A'}</InlineMath>.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · ORTHOGONAL PROJECTION</span></h2>
        <ProjectionWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · SIGNED DISTANCE</span></h2>
        <div className="content-block">
          <p>Let the hyperplane have normal <InlineMath>{'\\;a = (1,1,1)'}</InlineMath> through the origin
            (<InlineMath>{'x_c = 0'}</InlineMath>), and take the point <InlineMath>{'\\;x_0 = (2, 1.5, 0.5)'}</InlineMath>.
            Then</p>
          <DisplayMath>{String.raw`a\cdot(x_0 - x_c) = 2 + 1.5 + 0.5 = 4, \qquad \lVert a\rVert = \sqrt3 \approx 1.732,`}</DisplayMath>
          <p>so the signed distance is <InlineMath>{'\\;4/\\sqrt3 \\approx 2.31 > 0'}</InlineMath> — the point is on the
            <InlineMath>{'\\;H^+'}</InlineMath> side, about 2.31 units off the plane. Flip to a point with a negative
            dot product and the sign flips to <InlineMath>{'H^-'}</InlineMath>, exactly as the widget's badge reports.</p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🛑</div>
              <h3>Collision / safe side</h3>
              <p>A safety boundary is a hyperplane; the sign of a·(x−x_c) tells a robot instantly whether it is on the safe
                side and the magnitude how much margin it has.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Least squares = projection</h3>
              <p>Fitting AᵀAx = Aᵀb projects the data b onto range(A). The residual sticks out orthogonally — the picture in
                the second widget.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">✂️</div>
              <h3>Classification boundary</h3>
              <p>A linear classifier <em>is</em> a hyperplane; the signed distance is the decision score fed to sign(·) —
                the heart of the next lecture's SVM.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>Plane fitting (RANSAC)</h3>
              <p>Fitting a ground plane to a LiDAR point cloud uses point-to-plane signed distances as the inlier test.</p>
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
            question="A hyperplane in ℝⁿ has dimension:"
            options={['n', 'n − 1', '1', '2']}
            correct={1}
            explanation="A hyperplane is co-dimension one: dimension n − 1. In ℝ² it's a line; in ℝ³ a plane. It's a translate of the null space of a single row vector."
          />
          <QuizQ
            num={2} type="Computational"
            question="For a·(x − x_c) with ‖a‖ ≠ 1, the SIGNED distance to the hyperplane is:"
            options={[
              'a·(x − x_c)',
              'a·(x − x_c) / ‖a‖',
              '‖a‖ · a·(x − x_c)',
              '|a·x|',
            ]}
            correct={1}
            explanation="Divide by ‖a‖ to normalize: a·(x − x_c)/‖a‖. Only when ‖a‖ = 1 is the raw dot product already the signed distance."
          />
          <QuizQ
            num={3} type="Geometric"
            question="The orthogonal projection x* of x₀ onto a subspace V is characterized by:"
            options={[
              'x* is the farthest point in V',
              'x* ∈ V and (x₀ − x*) ⟂ V',
              'x* = x₀',
              'x* = 0',
            ]}
            correct={1}
            explanation="The closest point lies in V and the error x₀ − x* is orthogonal to all of V. That orthogonality is what makes it the minimizer of ‖x₀ − x‖."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Why are the projection normal equations UᵀUα = Uᵀx₀ the same as least squares?"
            options={[
              'They are unrelated',
              'Setting U = A and x₀ = b gives AᵀAx = Aᵀb — least squares projects b onto col span(A)',
              'Because U is always the identity',
              'Because projection ignores the basis',
            ]}
            correct={1}
            explanation="Least squares minimizes ‖Ax − b‖, i.e. finds the point in range(A) closest to b — an orthogonal projection. The Gram matrix UᵀU becomes AᵀA."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write the hyperplane definition, the two half-spaces, and the signed-distance formula.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) Dimension of a hyperplane in ℝⁿ? (b) What characterizes an orthogonal projection?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Compute the signed distance of (2, 1.5, 0.5) to the plane with normal (1,1,1) through the origin.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain why least squares is an orthogonal projection onto col span(A).</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain hyperplanes and half-spaces to a friend with the "which side of the line?" picture.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
