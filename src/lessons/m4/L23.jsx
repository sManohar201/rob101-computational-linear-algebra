import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, sphere, axisArrow, gridXY, label, disposeObject,
} from '../shared/three-helpers.js'

const f2 = n => { const r = Math.round(n * 100) / 100; return (Object.is(r, -0) ? 0 : r).toFixed(2) }

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — The max-margin classifier
//  Two labelled point clouds. Rotate the boundary line and read the margin (the
//  smallest gap to either class). "Snap to optimal" finds the orientation that
//  MAXIMIZES that smallest gap — the support-vector machine solution.
// ════════════════════════════════════════════════════════════════════════════

const SVM_PRESETS = [
  {
    label: 'Comfortably separable',
    A: [[2, 2.4], [3, 1.4], [2.4, 3.1], [3.4, 2.6]],
    B: [[-2, -1], [-2.6, -2.1], [-1.4, -2.4], [-3, -1.2]],
  },
  {
    label: 'Tight margin',
    A: [[1, 1.6], [2, 0.8], [1.6, 2.2], [0.6, 1.0]],
    B: [[-0.6, -1.0], [-1.6, -0.6], [-1.0, -1.8], [0.2, -1.4]],
  },
  {
    label: 'Diagonal split',
    A: [[2.6, -0.4], [3.2, 0.8], [1.8, 0.6], [2.2, 1.8]],
    B: [[-1.2, 2.0], [-2.2, 1.0], [-0.6, 1.0], [-1.6, 2.6]],
  },
]

// best (max-margin) separator by brute force over orientation
function bestSeparator(A, B) {
  let best = null
  for (let i = 0; i <= 720; i++) {
    const phi = (i * Math.PI) / 720
    const n = [Math.cos(phi), Math.sin(phi)]
    const pa = A.map(p => n[0] * p[0] + n[1] * p[1])
    const pb = B.map(p => n[0] * p[0] + n[1] * p[1])
    const minA = Math.min(...pa), maxA = Math.max(...pa)
    const minB = Math.min(...pb), maxB = Math.max(...pb)
    const gapPos = minA - maxB    // A on + side
    const gapNeg = minB - maxA    // A on − side
    let gap, c, signA
    if (gapPos >= gapNeg) { gap = gapPos; c = (minA + maxB) / 2; signA = 1 }
    else { gap = gapNeg; c = (maxA + minB) / 2; signA = -1 }
    if (!best || gap > best.gap) best = { phi, n, c, gap, signA }
  }
  return best
}

function SVMWidget() {
  const [idx, setIdx] = useState(0)
  const [params, setParams] = useState({ phi: 90, c: 0 })
  const dyn = useRef([])
  const P = SVM_PRESETS[idx]
  const opt = bestSeparator(P.A, P.B)
  const shown = useAnimatedParams(params)

  const phi = (shown.phi * Math.PI) / 180
  const n = [Math.cos(phi), Math.sin(phi)]
  const c = shown.c
  // signed margin for each point: ℓᵢ (n·xᵢ − c), with A wanting + side
  const dist = (p, lbl) => lbl * (n[0] * p[0] + n[1] * p[1] - c)
  const dA = P.A.map(p => dist(p, 1))
  const dB = P.B.map(p => dist(p, -1))
  const all = [...dA, ...dB]
  const margin = Math.min(...all)
  const separated = margin > 0

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(gridXY(5, 1))
      scene.add(axisArrow([1, 0, 0], 5, COL.x))
      scene.add(axisArrow([0, 1, 0], 5, COL.y))
    },
    { target: [0, 0, 0], camStart: { theta: 0, phi: Math.PI / 2, r: 15 }, zoom: [9, 24], lockPolar: [1.3, 1.84] }
  )

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const dir = new THREE.Vector3(-n[1], n[0], 0)   // along the boundary
    const nv = new THREE.Vector3(n[0], n[1], 0)
    const base = nv.clone().multiplyScalar(c)
    const seg = (off, col, r) => {
      const o = base.clone().add(nv.clone().multiplyScalar(off))
      add(tube(o.clone().add(dir.clone().multiplyScalar(-6)), o.clone().add(dir.clone().multiplyScalar(6)), col, r))
    }
    seg(0, separated ? COL.vertex : COL.line3, 0.045)            // boundary
    if (separated) { seg(margin, COL.guide, 0.02); seg(-margin, COL.guide, 0.02) } // margin bands
    // points
    P.A.forEach((p, i) => {
      add(sphere(new THREE.Vector3(p[0], p[1], 0), COL.x, 0.16))
      if (separated && dA[i] < margin + 1e-3) add(sphere(new THREE.Vector3(p[0], p[1], 0), 0xffffff, 0.07)) // support vector dot
    })
    P.B.forEach((p, i) => {
      add(sphere(new THREE.Vector3(p[0], p[1], 0), COL.z, 0.16))
      if (separated && dB[i] < margin + 1e-3) add(sphere(new THREE.Vector3(p[0], p[1], 0), 0xffffff, 0.07))
    })
    add(label('class +1', new THREE.Vector3(3.6, 3.6, 0), '#c92a2a', 0.42))
    add(label('class −1', new THREE.Vector3(-3.6, -3.2, 0), '#1864ab', 0.42))
  }, [idx, shown.phi, shown.c]) // eslint-disable-line react-hooks/exhaustive-deps

  const optDeg = (opt.phi * 180) / Math.PI
  return (
    <div className="widget">
      <p className="widget-caption">
        A linear classifier is just a <strong>hyperplane</strong> separating two labelled classes — but which one? The
        <strong> max-margin</strong> (support-vector) choice pushes the boundary as far from <em>both</em> clouds as
        possible, maximizing the smallest gap. Rotate and shift the line to feel the trade-off, then
        <strong> snap to the optimum</strong>. The points that touch the margin bands are the
        <strong> support vectors</strong> — they alone determine the boundary.
      </p>
      <p className="widget-instructions">drag to orbit · rotate/shift the boundary · white-dotted points are the support vectors</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">boundary angle φ = {f2(shown.phi)}°</div>
              <div className="hud-eq" style={{ color: separated ? '#69db7c' : '#ff8787' }}>margin = {f2(margin)}</div>
              <div className="hud-note">optimal margin = {f2(opt.gap / 2)} at φ = {f2(optDeg)}°</div>
              <div className="hud-note">‖a‖ = 1/margin ⇒ min ½‖a‖² ⇔ max margin</div>
            </div>
            <div className={`hud-badge ${separated ? (Math.abs(margin - opt.gap / 2) < 0.03 ? 'badge-unique' : 'badge-infinite') : 'badge-none'}`}>
              {!separated ? '✗ not separating — a point is misclassified'
                : Math.abs(margin - opt.gap / 2) < 0.03 ? '✓ max-margin solution (SVM)'
                  : 'separates, but not the widest margin'}
            </div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {SVM_PRESETS.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setParams({ phi: 90, c: 0 }) }}>{p.label}</button>
          ))}
          <button className="preset-btn" onClick={() => setParams({ phi: ((optDeg % 180) + 180) % 180, c: opt.c })}>★ snap to optimum</button>
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <SliderRow label="angle φ" k="phi" value={params.phi} min={0} max={180} step={1}
              onChange={(k, v) => setParams(p => ({ ...p, phi: v }))} />
            <SliderRow label="offset c" k="c" value={params.c} min={-3} max={3} step={0.1}
              onChange={(k, v) => setParams(p => ({ ...p, c: v }))} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — The QP behind the margin (DOM)
// ════════════════════════════════════════════════════════════════════════════

function QPWidget() {
  return (
    <div className="widget">
      <p className="widget-caption">
        Maximizing the margin is a <strong>Quadratic Program</strong>: the geometric margin is
        <InlineMath>{'\\;1/\\lVert a\\rVert'}</InlineMath>, so making the margin large means making
        <InlineMath>{'\\;\\lVert a\\rVert'}</InlineMath> small — a quadratic objective — subject to every point being
        classified with at least unit confidence (linear constraints). This is the exact form solvers like OSQP eat for
        breakfast.
      </p>
      <div className="widget-card">
        <div style={{ padding: '18px 22px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3' }}>
          <div style={{ color: '#9aa7bd', fontSize: 12, marginBottom: 8 }}>Hard-margin SVM (with <code>w = [a; a₀]</code>, <code>x̃ᵢ = [xᵢ; 1]</code>):</div>
          <DisplayMath>{String.raw`\min_{w}\ \tfrac12\lVert w\rVert_2^2 \quad\text{subject to}\quad \ell_i\,(w^{\top}\tilde x_i) \ge 1,\ \ i = 1,\dots,n.`}</DisplayMath>
          <div style={{ color: '#9aa7bd', fontSize: 12, margin: '14px 0 8px' }}>Standard QP form (what OSQP solves):</div>
          <DisplayMath>{String.raw`\min_{x}\ \tfrac12 x^{\top} Q x + q^{\top} x \quad\text{s.t.}\quad A_{\text{in}}x \le b_{\text{in}}.`}</DisplayMath>
          <div style={{ color: '#9aa7bd', fontSize: 12, margin: '14px 0 8px' }}>Even ordinary least squares is a QP:</div>
          <DisplayMath>{String.raw`\lVert Ax - b\rVert_2^2 \ \Longleftrightarrow\ Q = 2A^{\top}A,\quad q = -2A^{\top}b.`}</DisplayMath>
          <div style={{ color: '#9aa7bd', fontSize: 11.5, marginTop: 6 }}>
            Predict a new point with the sign of the score: Class = sign(a*·x_data + a₀*). If Q is positive definite and
            the data are separable, the optimum exists and is unique.
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L23() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#f3eefe', color: '#7c3aed', borderColor: '#ddd0fb' }}>
          Module 4 · Lecture 23 · Grizzle Ch. 13 §13.3, Ch. 12 §12.8
        </div>
        <h1 className="lesson-title">Quadratic Programs &amp; the Max-Margin Classifier</h1>
        <p className="lesson-subtitle">
          Put a hyperplane to work: <strong>separate two classes</strong> of data. Of all the lines that split them, the
          best generalizer is the one with the widest <strong>margin</strong> — and finding it is a
          <strong> Quadratic Program</strong>, the same optimization template behind least squares and model-predictive
          control. This is the linear <strong>Support Vector Machine</strong>.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Suppose two kinds of terrain — safe and unsafe — show up as two clouds of points, and you want a rule to label
            new ground. A straight boundary will do, but infinitely many lines separate the clouds. Which is best? The one
            that leaves the <strong>widest buffer</strong> on both sides: if the nearest examples are far from the line,
            small measurement noise won't flip their label. That buffer is the <strong>margin</strong>.
          </p>
          <p>
            Remarkably, only the handful of points sitting <em>on</em> the margin matter — the <strong>support
            vectors</strong>. Move any other point and the boundary doesn't budge. Finding the widest-margin line turns out
            to be a clean optimization: minimize a quadratic (the inverse margin) subject to linear "classify everything
            correctly" constraints — a <strong>Quadratic Program</strong>.
          </p>
        </div>
      </section>

      {/* ── Formalism: margin ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · THE MAX-MARGIN PROBLEM</span></h2>
        <div className="content-block">
          <p>Label the data <InlineMath>{'\\;\\ell_i\\in\\{-1,+1\\}'}</InlineMath> and write the hyperplane as
            <InlineMath>{'\\;y(x) = a^{\\top}x + a_0 = 0'}</InlineMath>. Stack the weight and bias into
            <InlineMath>{'\\;w = [a;\\,a_0]'}</InlineMath> and append a 1 to each input,
            <InlineMath>{'\\;\\tilde x_i = [x_i;\\,1]'}</InlineMath>. Asking each point to sit on its correct side with
            <strong> unit confidence</strong> gives</p>
          <DisplayMath>{String.raw`\ell_i\,(w^{\top}\tilde x_i) \ge 1, \qquad i = 1,\dots,n.`}</DisplayMath>
          <p>The geometric margin between the two classes is <InlineMath>{'\\;2/\\lVert a\\rVert'}</InlineMath>, so
            maximizing the margin is minimizing <InlineMath>{'\\;\\lVert a\\rVert'}</InlineMath>:</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\min_{w}\ \tfrac12\lVert w\rVert_2^2 \quad\text{subject to}\quad \ell_i\,(w^{\top}\tilde x_i) \ge 1.`}</DisplayMath>
            A convex quadratic objective with linear inequality constraints — a <strong>Quadratic Program</strong>. The
            active constraints (equality holding) pin down the <strong>support vectors</strong>; a new point is classified
            by <InlineMath>{'\\;\\text{sign}(a^{*}\\cdot x_{\\text{data}} + a_0^{*})'}</InlineMath>.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE MAX-MARGIN CLASSIFIER</span></h2>
        <SVMWidget />
      </section>

      {/* ── Formalism: QP ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · QUADRATIC PROGRAMS</span></h2>
        <div className="content-block">
          <p>A <strong>Quadratic Program</strong> is the general template</p>
          <DisplayMath>{String.raw`\min_{x\in\mathbb{R}^m}\ \tfrac12 x^{\top} Q x + q^{\top} x \quad\text{s.t.}\quad A_{\text{in}}x \le b_{\text{in}},\ \ A_{\text{eq}}x = b_{\text{eq}},\ \ lb \le x \le ub.`}</DisplayMath>
          <div className="callout callout-info">
            If <InlineMath>{'Q'}</InlineMath> is symmetric positive definite and the feasible region is non-empty, the
            optimum <strong>exists and is unique</strong>. Solvers like <strong>OSQP</strong> solve these in milliseconds.
            QPs are everywhere: the SVM above, spline fitting with continuity constraints at knot points, and
            model-predictive control.
          </div>
          <p>The connection to everything we built: even <strong>ordinary least squares</strong> is a QP. Expanding
            <InlineMath>{'\\;\\lVert Ax - b\\rVert_2^2 = x^{\\top}(A^{\\top}A)x - 2b^{\\top}Ax + b^{\\top}b'}</InlineMath>
            matches the QP objective with</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`Q = 2A^{\top}A, \qquad q = -2A^{\top}b.`}</DisplayMath>
            So the normal equations of Lecture 10, the projection of Lecture 22, and this classifier are all the same
            optimization wearing different clothes.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · THE QP BEHIND THE MARGIN</span></h2>
        <QPWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · MARGIN OF A SIMPLE SPLIT</span></h2>
        <div className="content-block">
          <p>Take one <InlineMath>{'+1'}</InlineMath> point at <InlineMath>{'\\;(1,0)'}</InlineMath> and one
            <InlineMath>{'\\;-1'}</InlineMath> point at <InlineMath>{'\\;(-1,0)'}</InlineMath>. By symmetry the
            max-margin boundary is the <InlineMath>{'\\;x_2'}</InlineMath>-axis: normal
            <InlineMath>{'\\;a = (1,0)'}</InlineMath>, bias <InlineMath>{'\\;a_0 = 0'}</InlineMath>. The constraints
            <InlineMath>{'\\;\\ell_i(a^{\\top}x_i + a_0)\\ge 1'}</InlineMath> read
            <InlineMath>{'\\;(+1)(a_1\\cdot 1) \\ge 1'}</InlineMath> and
            <InlineMath>{'\\;(-1)(a_1\\cdot(-1)) \\ge 1'}</InlineMath>, both giving
            <InlineMath>{'\\;a_1 \\ge 1'}</InlineMath>.</p>
          <p>Minimizing <InlineMath>{'\\;\\tfrac12 a_1^2'}</InlineMath> drives <InlineMath>{'\\;a_1 = 1'}</InlineMath>, so
            <InlineMath>{'\\;\\lVert a\\rVert = 1'}</InlineMath> and the geometric margin is
            <InlineMath>{'\\;2/\\lVert a\\rVert = 2'}</InlineMath> — the full distance between the points, split evenly.
            Both points are support vectors. Widen the cloud and the snap-to-optimum button reproduces exactly this
            "split the difference, perpendicular to the nearest pair" behaviour.</p>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🥾</div>
              <h3>Terrain classification</h3>
              <p>A walking robot labels patches as traversable or not from features; a max-margin boundary gives a robust
                go/no-go rule with built-in safety buffer.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎛️</div>
              <h3>QP control (MPC)</h3>
              <p>Model-predictive controllers solve a QP every tick — quadratic cost on tracking error, linear constraints
                on actuators and safety.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📈</div>
              <h3>Spline fitting</h3>
              <p>Fitting smooth piecewise polynomials to noisy data is a QP with linear continuity constraints at the knot
                points.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔍</div>
              <h3>Support vectors</h3>
              <p>Only the boundary-touching examples matter, so SVMs are memory-efficient and interpretable — you can point
                to the data that defines the decision.</p>
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
            question="The max-margin classifier chooses the separating hyperplane that:"
            options={[
              'Passes through the most data points',
              'Maximizes the distance to the nearest points of both classes',
              'Has the smallest possible margin',
              'Ignores the labels',
            ]}
            correct={1}
            explanation="It maximizes the margin — the buffer to the closest points on each side — for the most robust separation. Those closest points are the support vectors."
          />
          <QuizQ
            num={2} type="Computational"
            question="The hard-margin SVM is the QP:"
            options={[
              'max ½‖w‖² s.t. ℓᵢ(wᵀx̃ᵢ) ≤ 1',
              'min ½‖w‖² s.t. ℓᵢ(wᵀx̃ᵢ) ≥ 1',
              'min ‖w‖ s.t. wᵀx̃ᵢ = 0',
              'max margin with no constraints',
            ]}
            correct={1}
            explanation="Minimize ½‖w‖² (small ‖a‖ ⇒ large margin 1/‖a‖) subject to every point classified with unit confidence, ℓᵢ(wᵀx̃ᵢ) ≥ 1."
          />
          <QuizQ
            num={3} type="Geometric"
            question="Which data points determine the SVM boundary?"
            options={[
              'All of them equally',
              'Only the support vectors (those on the margin)',
              'Only the class means',
              'The points farthest from the boundary',
            ]}
            correct={1}
            explanation="Only the support vectors — the points touching the margin bands — set the boundary. Moving any interior point leaves the solution unchanged."
          />
          <QuizQ
            num={4} type="Transfer"
            question="How is ordinary least squares ‖Ax − b‖² a quadratic program?"
            options={[
              'It is not a QP',
              'With Q = 2AᵀA and q = −2Aᵀb in min ½xᵀQx + qᵀx',
              'Only if A is square',
              'With Q = A and q = b',
            ]}
            correct={1}
            explanation="Expanding ‖Ax−b‖² = xᵀ(AᵀA)x − 2bᵀAx + const matches ½xᵀQx + qᵀx with Q = 2AᵀA, q = −2Aᵀb — so least squares, projection, and SVM are all QPs."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>Write the hard-margin SVM QP and the general QP standard form.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) What is a support vector? (b) Why minimize ½‖w‖² to maximize margin?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo the worked example: find a and the margin for ±1 points at (±1, 0).</div>
            <div className="review-item"><span className="review-day">Day 7</span>Show that least squares is a QP with Q = 2AᵀA, q = −2Aᵀb.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain the max-margin idea to a friend with the "widest safe buffer" picture in under 2 minutes.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
