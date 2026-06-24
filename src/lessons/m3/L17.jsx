import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { fmt, QuizQ } from '../shared/ui.jsx'
import {
  COL, tube, curveTube, sphere, axisArrow, label, disposeObject,
} from '../shared/three-helpers.js'

const f3 = n => { const r = Math.round(n * 1000) / 1000; return (Object.is(r, -0) ? 0 : r).toFixed(3) }

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 1 — Newton's method on a curve
//  Step through xₖ₊₁ = xₖ − f(xₖ)/f'(xₖ). The tangent at the current guess is
//  drawn; where it crosses the x-axis is the next guess. Watch it rocket toward
//  the root (quadratic convergence) — far faster than bisection.
// ════════════════════════════════════════════════════════════════════════════

const NEWT = [
  { label: 'x² − 2  (√2)', f: x => x * x - 2, df: x => 2 * x, x0: 2, dom: [-0.3, 2.6], root: Math.SQRT2 },
  { label: 'x³ − 2x − 5', f: x => x ** 3 - 2 * x - 5, df: x => 3 * x * x - 2, x0: 2.5, dom: [1.4, 2.8], root: 2.0945514815 },
  { label: 'cos x − x', f: x => Math.cos(x) - x, df: x => -Math.sin(x) - 1, x0: 0.2, dom: [-0.2, 1.6], root: 0.7390851332 },
]

function NewtonWidget() {
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState(0)
  const dyn = useRef([])
  const P = NEWT[idx]

  // iterate Newton from x0
  const xs = [P.x0]
  for (let k = 0; k < 6; k++) {
    const x = xs[k]
    const d = P.df(x)
    if (Math.abs(d) < 1e-9) break
    xs.push(x - P.f(x) / d)
  }
  const xk = xs[Math.min(step, xs.length - 1)]

  // fit the curve into ~±4 units vertically
  const [lo, hi] = P.dom
  const NPTS = 80
  let ymax = 1e-6
  for (let i = 0; i <= NPTS; i++) { const x = lo + (hi - lo) * i / NPTS; ymax = Math.max(ymax, Math.abs(P.f(x))) }
  const XS = 7 / (hi - lo)       // x scale to fill width
  const YS = 3.2 / ymax          // y scale
  const X0 = (lo + hi) / 2       // center the domain
  const sx = x => (x - X0) * XS
  const sy = y => y * YS

  const { containerRef, ctxRef } = useOrbitScene(
    scene => {
      scene.add(axisArrow([1, 0, 0], 4.6, COL.x))
      scene.add(axisArrow([0, 1, 0], 4, COL.y))
      scene.add(label('x', new THREE.Vector3(4.9, -0.35, 0), '#c92a2a'))
      scene.add(label('f(x)', new THREE.Vector3(-0.55, 4.2, 0), '#2b8a3e'))
    },
    { target: [0, 0, 0], camStart: { theta: 0, phi: Math.PI / 2, r: 13 }, zoom: [8, 20], lockPolar: [1.3, 1.84] }
  )

  // static curve (rebuilt only when preset changes)
  const curveRef = useRef(null)
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    if (curveRef.current) { scene.remove(curveRef.current); disposeObject(curveRef.current) }
    const pts = []
    for (let i = 0; i <= NPTS; i++) { const x = lo + (hi - lo) * i / NPTS; pts.push(new THREE.Vector3(sx(x), sy(P.f(x)), 0)) }
    const g = new THREE.Group()
    g.add(curveTube(pts, COL.line2, 0.04))
    g.add(sphere(new THREE.Vector3(sx(P.root), 0, 0), COL.point, 0.1)) // true root
    scene.add(g); curveRef.current = g
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { scene } = ctx
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) })
    dyn.current = []
    const add = o => { scene.add(o); dyn.current.push(o) }
    const fx = P.f(xk), d = P.df(xk)
    const Pcurve = new THREE.Vector3(sx(xk), sy(fx), 0)
    // vertical drop from axis to the curve
    add(tube(new THREE.Vector3(sx(xk), 0, 0), Pcurve, COL.guide, 0.02))
    add(sphere(Pcurve, COL.line1, 0.1))
    add(sphere(new THREE.Vector3(sx(xk), 0, 0), COL.x, 0.09))
    add(label(`x${step}`, new THREE.Vector3(sx(xk), -0.4, 0), '#c92a2a', 0.42))
    // tangent line to where it meets the axis → next guess
    if (Math.abs(d) > 1e-9) {
      const xn = xk - fx / d
      add(tube(Pcurve, new THREE.Vector3(sx(xn), 0, 0), COL.line1, 0.028))
      add(sphere(new THREE.Vector3(sx(xn), 0, 0), COL.vertex, 0.085))
    }
  }, [idx, step]) // eslint-disable-line react-hooks/exhaustive-deps

  const err = Math.abs(xk - P.root)
  return (
    <div className="widget">
      <p className="widget-caption">
        Newton's method linearises: at the current guess it follows the <strong>tangent line</strong> down to the x-axis
        and uses that crossing as the next guess. Each step roughly <em>doubles</em> the number of correct digits
        (quadratic convergence). Step through and watch the orange tangent walk the guess onto the teal root.
      </p>
      <p className="widget-instructions">drag to orbit · advance the iteration · the orange line is the tangent, the teal dot the true root</p>
      <div className="widget-card">
        <div className="widget-wrapper">
          <div ref={containerRef} className="widget-canvas" />
          <div className="widget-hud">
            <div className="hud-panel" style={{ fontSize: 12 }}>
              <div className="hud-eq">x{step} = {f3(xk)}</div>
              <div className="hud-eq">f(x{step}) = {f3(P.f(xk))}</div>
              <div className="hud-note">true root ≈ {f3(P.root)}</div>
              <div className="hud-note" style={{ color: err < 1e-6 ? '#69db7c' : undefined }}>error = {err.toExponential(2)}</div>
            </div>
            <div className={`hud-badge ${err < 1e-6 ? 'badge-unique' : 'badge-infinite'}`}>
              {err < 1e-6 ? '✓ converged to machine precision' : `xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ)`}
            </div>
          </div>
          <div className="orbit-hint">drag · scroll</div>
        </div>
        <div className="preset-bar">
          {NEWT.map((p, i) => (
            <button key={i} className={`preset-btn ${idx === i ? 'active' : ''}`}
              onClick={() => { setIdx(i); setStep(0) }}>{p.label}</button>
          ))}
        </div>
        <div className="controls-grid">
          <div className="controls-col">
            <div className="controls-label">Iteration step</div>
            <div className="preset-bar" style={{ marginTop: 0 }}>
              <button className="preset-btn" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>‹ back</button>
              {[0, 1, 2, 3, 4, 5].map(s => (
                <button key={s} className={`preset-btn ${step === s ? 'active' : ''}`} onClick={() => setStep(s)}>{s}</button>
              ))}
              <button className="preset-btn" disabled={step >= 5} onClick={() => setStep(s => Math.min(5, s + 1))}>next ›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET 2 — Bisection vs Newton: convergence race (DOM)
//  Both find √2. Bisection halves the bracket (linear); Newton squares the error
//  (quadratic). The iteration counts to a 1e-10 tolerance tell the whole story.
// ════════════════════════════════════════════════════════════════════════════

function RaceWidget() {
  const f = x => x * x - 2, df = x => 2 * x, root = Math.SQRT2, tol = 1e-10
  // bisection on [1,2]
  let a = 1, b = 2
  const bis = []
  for (let k = 0; k < 14; k++) {
    const c = (a + b) / 2
    bis.push({ k, c, err: Math.abs(c - root) })
    if (f(c) * f(a) < 0) b = c; else a = c
  }
  // newton from x0 = 2
  const nwt = []
  let x = 2
  for (let k = 0; k < 7; k++) {
    nwt.push({ k, c: x, err: Math.abs(x - root) })
    x = x - f(x) / df(x)
  }
  return (
    <div className="widget">
      <p className="widget-caption">
        Both methods solve <InlineMath>{'x^2 - 2 = 0'}</InlineMath>. <strong>Bisection</strong> just halves a bracket each
        step — guaranteed, but the error only halves (linear). <strong>Newton</strong> uses slope information and roughly
        <em> squares</em> the error each step (quadratic). Watch how many iterations each needs to nail
        <InlineMath>{'\\;\\sqrt2'}</InlineMath> to ten digits.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { name: 'Bisection (bracket halving)', col: '#1c7ed6', rows: bis },
            { name: 'Newton (tangent steps)', col: '#e8590c', rows: nwt },
          ].map(tbl => (
            <div key={tbl.name} style={{ flex: '1 1 280px', padding: '14px 16px', background: '#0f1729', borderRadius: 10, color: '#dbe4f3', fontFamily: 'monospace', fontSize: 12.5 }}>
              <div style={{ color: tbl.col, fontWeight: 700, marginBottom: 8 }}>{tbl.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '2px 14px' }}>
                <span style={{ color: '#9aa7bd' }}>k</span><span style={{ color: '#9aa7bd' }}>estimate</span><span style={{ color: '#9aa7bd' }}>error</span>
                {tbl.rows.map(r => [
                  <span key={`k${r.k}`}>{r.k}</span>,
                  <span key={`c${r.k}`}>{f3(r.c)}</span>,
                  <span key={`e${r.k}`} style={{ color: r.err < tol ? '#69db7c' : undefined }}>{r.err.toExponential(1)}</span>,
                ])}
              </div>
            </div>
          ))}
        </div>
        <p className="widget-instructions" style={{ marginTop: 10 }}>
          Newton reaches 1e-10 in ~5 steps; bisection needs ~34. Quadratic beats linear — but bisection never fails to
          bracket, while Newton can diverge if the tangent is bad.
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L17() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag" style={{ background: '#eafaf0', color: '#0f9d58', borderColor: '#bce8cf' }}>
          Module 3 · Lecture 17 · Grizzle Ch. 11 §11.1–11.4
        </div>
        <h1 className="lesson-title">Changing Gears: Bisection &amp; Newton's Method</h1>
        <p className="lesson-subtitle">
          The real world is <strong>nonlinear</strong>. We leave <InlineMath>{'Ax = b'}</InlineMath> behind and learn to
          solve <InlineMath>{'\\;f(x) = 0'}</InlineMath>. Two ideas carry us: <strong>bisection</strong>, which is slow but
          can't fail, and <strong>Newton's method</strong>, which linearises locally and converges blazingly fast.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            A nonlinear equation can have zero, one, many, or infinitely many solutions — there is no neat formula like
            Gaussian elimination. So we hunt for roots <strong>iteratively</strong>, improving a guess until
            <InlineMath>{'\\;f(x)'}</InlineMath> is close enough to zero.
          </p>
          <p>
            <strong>Bisection</strong> is the high–low number game. If <InlineMath>{'f'}</InlineMath> is positive at one end
            of an interval and negative at the other, a root is trapped somewhere between; check the midpoint, keep the
            half that still straddles zero, repeat. It can never lose the root — but it only halves the uncertainty each
            step. <strong>Newton's method</strong> is greedier and smarter: it slides down the tangent line to the axis,
            using the local slope to leap most of the way to the root in one bound.
          </p>
        </div>
      </section>

      {/* ── Formalism: bisection ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · BISECTION &amp; THE IVT</span></h2>
        <div className="content-block">
          <p>
            A <strong>root</strong> of <InlineMath>{'f:\\mathbb{R}\\to\\mathbb{R}'}</InlineMath> is an
            <InlineMath>{'\\;x^{*}'}</InlineMath> with <InlineMath>{'f(x^{*}) = 0'}</InlineMath>. Bisection rests on the
            <strong> Intermediate Value Theorem</strong>:
          </p>
          <div className="callout callout-info">
            If <InlineMath>{'f'}</InlineMath> is continuous on <InlineMath>{'[a,b]'}</InlineMath> and
            <InlineMath>{'\\;f(a)\\cdot f(b) < 0'}</InlineMath> (opposite signs), then there is a root
            <InlineMath>{'\\;c\\in(a,b)'}</InlineMath>. We say <InlineMath>{'[a,b]'}</InlineMath> <strong>brackets</strong>
            the root.
          </div>
          <p>The algorithm: compute the midpoint <InlineMath>{'c = (a+b)/2'}</InlineMath>; if
            <InlineMath>{'\\;|f(c)|\\le\\text{tol}'}</InlineMath> stop; else keep whichever half still has a sign change
            (<InlineMath>{'b\\leftarrow c'}</InlineMath> if <InlineMath>{'\\;f(c)f(a)<0'}</InlineMath>, else
            <InlineMath>{'\\;a\\leftarrow c'}</InlineMath>) and repeat. The bracket width halves every step — robust, but
            only linear convergence. (Solving <InlineMath>{'x^2-2=0'}</InlineMath> this way never gives <em>exactly</em>
            <InlineMath>{'\\;\\sqrt2'}</InlineMath>; you stop at a tolerance.)</p>
        </div>
      </section>

      {/* ── Formalism: derivatives ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · DERIVATIVE = LOCAL SLOPE</span></h2>
        <div className="content-block">
          <p>Newton needs the <strong>derivative</strong> — the local slope, the best linear approximation near a point:</p>
          <DisplayMath>{String.raw`\frac{df(x_0)}{dx} := \lim_{h\to 0}\frac{f(x_0+h)-f(x_0)}{h}.`}</DisplayMath>
          <p>When you can't differentiate by hand, approximate it numerically with a small
            <InlineMath>{'\\;h>0'}</InlineMath>:</p>
          <div className="callout callout-success">
            <DisplayMath>{String.raw`\underbrace{\frac{f(x_0+h)-f(x_0)}{h}}_{\text{forward}}, \quad \underbrace{\frac{f(x_0)-f(x_0-h)}{h}}_{\text{backward}}, \quad \underbrace{\frac{f(x_0+h)-f(x_0-h)}{2h}}_{\text{symmetric (central)}}.`}</DisplayMath>
            Forward/backward are exact for <em>linear</em> functions; the symmetric difference is exact for
            <em> quadratics</em> and is the most accurate. A function is differentiable at
            <InlineMath>{'\\;x_0'}</InlineMath> when all three agree as <InlineMath>{'\\;h\\to0'}</InlineMath> — they
            <em> disagree</em> for <InlineMath>{'|x|'}</InlineMath> at <InlineMath>{'0'}</InlineMath> (forward gives
            <InlineMath>{'\\;+1'}</InlineMath>, backward <InlineMath>{'\\;-1'}</InlineMath>), which is why it has no
            derivative there.
          </div>
        </div>
      </section>

      {/* ── Formalism: newton ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag formalism-tag">FORMALISM · NEWTON'S METHOD</span></h2>
        <div className="content-block">
          <p>Take the first-order Taylor expansion around the current guess and ask where the tangent hits zero:</p>
          <DisplayMath>{String.raw`0 \approx f(x_k) + \frac{df(x_k)}{dx}(x_{k+1}-x_k) \;\Longrightarrow\; \boxed{\,x_{k+1} = x_k - \left(\frac{df(x_k)}{dx}\right)^{-1} f(x_k)\,}.`}</DisplayMath>
          <div className="callout callout-warning">
            <strong>Damped Newton.</strong> If the linear model is poor (slope near zero, or far from the root), the full
            step can overshoot and diverge. Add a step factor <InlineMath>{'\\;\\epsilon\\in(0,1)'}</InlineMath>:
            <DisplayMath>{String.raw`x_{k+1} = x_k - \epsilon\left(\frac{df(x_k)}{dx}\right)^{-1} f(x_k).`}</DisplayMath>
            Smaller steps are safer but slower — the same speed-vs-stability trade-off we'll see again in optimization.
          </div>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · NEWTON ON A CURVE</span></h2>
        <NewtonWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag example-tag">WORKED EXAMPLE · √2 BY NEWTON</span></h2>
        <div className="content-block">
          <p>Solve <InlineMath>{'\\;f(x) = x^2 - 2 = 0'}</InlineMath>, so <InlineMath>{'\\;f\'(x) = 2x'}</InlineMath> and the
            update is <InlineMath>{'\\;x_{k+1} = x_k - \\dfrac{x_k^2-2}{2x_k} = \\dfrac{x_k}{2} + \\dfrac{1}{x_k}'}</InlineMath>
            (the ancient Babylonian square-root rule!). From <InlineMath>{'x_0 = 2'}</InlineMath>:</p>
          <DisplayMath>{String.raw`x_1 = 1.5,\quad x_2 = 1.41\overline{6},\quad x_3 = 1.41421568\ldots,\quad x_4 = 1.41421356\ldots`}</DisplayMath>
          <p>Four steps give <InlineMath>{'\\;\\sqrt2'}</InlineMath> to machine precision — the error squares each step
            (≈ 1, then 0.08, 0.002, 2×10⁻⁶, 10⁻¹²). Bisection on <InlineMath>{'[1,2]'}</InlineMath> would need about 34
            steps for the same accuracy. The next widget races them.</p>
        </div>
      </section>

      <section className="lesson-section widget-section">
        <h2 className="section-title"><span className="section-tag widget-tag">INTERACTIVE · BISECTION vs NEWTON RACE</span></h2>
        <RaceWidget />
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span></h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦿</div>
              <h3>Reach constraints</h3>
              <p>Finding the joint angle that places a foot exactly on a target line is a scalar root-find — Newton solves
                it in a few iterations inside the control loop.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔋</div>
              <h3>Battery / circuit models</h3>
              <p>Nonlinear device equations (diodes, motors) are solved for operating points by Newton iteration thousands
                of times per second.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛡️</div>
              <h3>Robust fallback</h3>
              <p>Production solvers start with safe bisection to bracket a root, then switch to Newton for speed — the best
                of both (Brent's method).</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Numerical derivatives</h3>
              <p>When a model has no analytic gradient, the symmetric-difference slope feeds Newton and every optimizer
                that follows in this module.</p>
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
            question="Bisection requires that, on the starting interval [a,b]:"
            options={[
              'f is differentiable',
              'f(a) and f(b) have opposite signs',
              'f(a) = f(b)',
              'a and b are both positive',
            ]}
            correct={1}
            explanation="By the IVT, a continuous f with f(a)·f(b) < 0 must cross zero in (a,b). That sign change is what brackets the root."
          />
          <QuizQ
            num={2} type="Computational"
            question="Newton's update for f(x) = 0 is:"
            options={[
              'xₖ₊₁ = xₖ + f(xₖ)·f′(xₖ)',
              'xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ)',
              'xₖ₊₁ = (a+b)/2',
              'xₖ₊₁ = xₖ − f′(xₖ)/f(xₖ)',
            ]}
            correct={1}
            explanation="Setting the tangent line f(xₖ)+f′(xₖ)(x−xₖ) to zero and solving gives xₖ₊₁ = xₖ − f(xₖ)/f′(xₖ)."
          />
          <QuizQ
            num={3} type="Geometric"
            question="Which numerical derivative is exact for quadratic functions?"
            options={[
              'Forward difference',
              'Backward difference',
              'Symmetric (central) difference',
              'None of them',
            ]}
            correct={2}
            explanation="The symmetric difference [f(x+h)−f(x−h)]/(2h) cancels the quadratic error term, making it exact for quadratics and more accurate in general."
          />
          <QuizQ
            num={4} type="Transfer"
            question="Why add a damping factor ε to Newton's step?"
            options={[
              'To make it converge faster',
              'To prevent overshoot/divergence when the linear approximation is poor',
              'To guarantee a bracket',
              'To avoid computing the derivative',
            ]}
            correct={1}
            explanation="When the tangent is a bad local model (small slope, far from the root), a full step can fly off. Scaling by ε∈(0,1) keeps steps conservative — safer but slower."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span></h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item"><span className="review-day">Day 0</span>State the IVT bracket condition and the Newton update; write the three finite-difference formulas.</div>
            <div className="review-item"><span className="review-day">Day 1</span>Answer: (a) Why can't bisection fail? (b) Why is Newton faster?</div>
            <div className="review-item"><span className="review-day">Day 3</span>Redo √2 by Newton from x₀ = 2 for three steps without notes.</div>
            <div className="review-item"><span className="review-day">Day 7</span>Explain when you'd prefer bisection over Newton and vice-versa.</div>
            <div className="review-item"><span className="review-day">Day 14</span>Explain Newton's method to a friend using the tangent-line picture in under 2 minutes.</div>
          </div>
        </div>
      </section>

    </div>
  )
}
