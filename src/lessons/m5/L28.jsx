import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — Squeeze Theorem visualizer.
//  Shows a function f(x) = x² sin(1/x) squeezed between g(x) = −x² and
//  h(x) = x². As x → 0, all three converge to 0, demonstrating the squeeze.
// ════════════════════════════════════════════════════════════════════════════

function SqueezeWidget() {
  const [zoom, setZoom] = useState(1.2) // half-range around 0

  const W = 280, H = 200
  const xMin = -zoom, xMax = zoom
  const yMin = -zoom * 0.8, yMax = zoom * 0.8

  const px = x => ((x - xMin) / (xMax - xMin)) * W
  const py = y => H - ((y - yMin) / (yMax - yMin)) * H

  // Build points for the three functions
  const steps = 300
  const fPts = [], gPts = [], hPts = []
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin)
    if (Math.abs(x) < 1e-6) continue
    const g = -x * x
    const h = x * x
    const fv = x * x * Math.sin(1 / x)
    if (Math.abs(g) < zoom * 0.9) gPts.push(`${px(x).toFixed(1)},${py(g).toFixed(1)}`)
    if (Math.abs(h) < zoom * 0.9) hPts.push(`${px(x).toFixed(1)},${py(h).toFixed(1)}`)
    if (Math.abs(fv) < zoom * 0.9) fPts.push(`${px(x).toFixed(1)},${py(fv).toFixed(1)}`)
  }

  return (
    <div className="widget">
      <p className="widget-caption">
        The blue curve is <InlineMath>{'f(x) = x^2 \\sin(1/x)'}</InlineMath> — it oscillates wildly but
        stays trapped between the orange parabola <InlineMath>{'g(x) = -x^2'}</InlineMath> (lower bound)
        and the green parabola <InlineMath>{'h(x) = x^2'}</InlineMath> (upper bound). As
        <InlineMath>{'\\;x \\to 0'}</InlineMath> both bounds go to zero, forcing
        <InlineMath>{'\\;f(x) \\to 0'}</InlineMath> as well. Zoom in to watch the squeeze tighten.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            {/* axes */}
            <line x1={0} y1={py(0)} x2={W} y2={py(0)} stroke="#ccd3de" strokeWidth="1" />
            <line x1={px(0)} y1={0} x2={px(0)} y2={H} stroke="#ccd3de" strokeWidth="1" />
            <text x={W - 8} y={py(0) + 12} fontSize="9" fill="#8899bb">x</text>
            <text x={px(0) + 3} y={9} fontSize="9" fill="#8899bb">y</text>

            {/* upper bound h(x) = x² — green */}
            {hPts.length > 1 && <polyline points={hPts.join(' ')} fill="none" stroke="#099268" strokeWidth="1.5" strokeDasharray="5 3" />}
            {/* lower bound g(x) = −x² — orange */}
            {gPts.length > 1 && <polyline points={gPts.join(' ')} fill="none" stroke="#e8590c" strokeWidth="1.5" strokeDasharray="5 3" />}
            {/* f(x) = x² sin(1/x) — blue */}
            {fPts.length > 1 && <polyline points={fPts.join(' ')} fill="none" stroke="#1c7ed6" strokeWidth="1.5" />}

            {/* origin dot */}
            <circle cx={px(0)} cy={py(0)} r="4" fill="#c92a2a" />
            <text x={px(0) + 5} y={py(0) - 5} fontSize="9" fill="#c92a2a">limit = 0</text>
          </svg>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span style={{ color: '#1c7ed6' }}>f(x) = x²sin(1/x)</span><strong>→ 0</strong></div>
              <div className="hud-row"><span style={{ color: '#099268' }}>h(x) = x² (upper)</span><strong>→ 0</strong></div>
              <div className="hud-row"><span style={{ color: '#e8590c' }}>g(x) = −x² (lower)</span><strong>→ 0</strong></div>
              <div className="hud-row"><span>Squeeze conclusion</span><strong style={{ color: '#c92a2a' }}>lim = 0</strong></div>
            </div>
            <label className="slider-row">
              <span className="slider-label">Zoom window ±{zoom.toFixed(2)}</span>
              <input type="range" min={0.1} max={1.8} step={0.05} value={zoom}
                onChange={e => setZoom(Number(e.target.value))} />
            </label>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginTop: '6px', lineHeight: '1.4' }}>
              Drag left to zoom into the origin and watch all three curves converge.
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

export default function L28() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#fef3e8', color: '#b05e0a', borderColor: '#fad5a5' }}>
          Module 5 · Lecture 28 · ROB 201
        </div>
        <h1 className="lesson-title">Continuity &amp; Squeeze Theorem</h1>
        <p className="lesson-subtitle">
          A continuous function is one with no jumps, holes, or explosions — the limit at every point
          exists and equals the function's value there. This lecture defines continuity precisely, proves
          the Squeeze Theorem (our main tool for evaluating tricky limits), and establishes the
          Intermediate Value Theorem, which guarantees that bisection always finds a root.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            "Continuous" has an everyday meaning — a path you can trace without lifting your pen — and
            a precise mathematical one. They agree: a continuous function is one whose graph you can draw
            in one smooth stroke with no jumps, no holes, and no vertical blowups. Most functions you
            encounter in physics and engineering are continuous on their natural domains — polynomials,
            sinusoids, exponentials, compositions thereof. The exceptions are engineered: switches,
            relays, bang-bang controllers, and step functions.
          </p>
          <p>
            The Squeeze Theorem is the key technique for evaluating limits that are otherwise hard to
            compute directly. The idea is simple: if you can trap an unknown function between two
            functions that both converge to the same limit, the trapped function must also converge to
            that limit. It is the same bounding philosophy from Lecture 25 — but now applied to limiting
            behavior instead of static values.
          </p>
          <p>
            The Intermediate Value Theorem (IVT) is what makes bisection root-finding (Lecture 17 in
            ROB 101) mathematically guaranteed rather than just heuristically plausible. If a continuous
            function changes sign on an interval, it must cross zero somewhere inside. Bisection exploits
            this by cutting the interval in half and checking which half still contains the sign change.
            The IVT is the proof that this process always works.
          </p>
        </div>
      </section>

      {/* ── Formalism: continuity ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · CONTINUITY AT A POINT</span>
        </h2>
        <div className="content-block">
          <p>
            A function <InlineMath>{'f'}</InlineMath> is <strong>continuous at</strong>
            <InlineMath>{'\\;c'}</InlineMath> if three conditions all hold:
          </p>
          <DisplayMath>{String.raw`\text{(i)}\;f(c)\text{ is defined},\quad \text{(ii)}\;\lim_{x\to c}f(x)\text{ exists},\quad \text{(iii)}\;\lim_{x\to c}f(x)=f(c).`}</DisplayMath>
          <p>
            In ε-δ language: for every <InlineMath>{'\\varepsilon > 0'}</InlineMath> there exists
            <InlineMath>{'\\;\\delta > 0'}</InlineMath> such that
            <InlineMath>{'\\;|x - c| < \\delta \\Rightarrow |f(x) - f(c)| < \\varepsilon'}</InlineMath>.
            Notice the key difference from the limit definition: here we use
            <InlineMath>{'\\;|x-c| < \\delta'}</InlineMath> (including <InlineMath>{'x=c'}</InlineMath>)
            rather than <InlineMath>{'\\;0 < |x-c| < \\delta'}</InlineMath> (excluding it), because
            <InlineMath>{'\\;f(c)'}</InlineMath> is now explicitly part of the requirement.
          </p>
          <p>
            A function is <strong>continuous on an interval</strong> <InlineMath>{'[a,b]'}</InlineMath>
            if it is continuous at every point inside and has one-sided continuity at the endpoints.
            Polynomials, sinusoids, exponentials, and all their compositions are continuous everywhere on
            their domains — a fact that saves enormous effort in integration and differentiation.
          </p>
          <div className="callout callout-success">
            <strong>Continuous functions preserve closedness.</strong> If <InlineMath>{'f'}</InlineMath>
            is continuous on a <em>closed</em> interval <InlineMath>{'[a,b]'}</InlineMath>, then its
            range is also a closed bounded interval (the Extreme Value Theorem, Lecture 47). This is
            why optimization over compact sets always has a solution — the minimum and maximum are
            actually attained.
          </div>
        </div>
      </section>

      {/* ── Formalism: Squeeze Theorem ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · THE SQUEEZE THEOREM</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Squeeze Theorem.</strong> Suppose <InlineMath>{'g(x) \\le f(x) \\le h(x)'}</InlineMath>
            on some punctured neighborhood of <InlineMath>{'c'}</InlineMath>, and
          </p>
          <DisplayMath>{String.raw`\lim_{x\to c}g(x) = \lim_{x\to c}h(x) = L.`}</DisplayMath>
          <p>
            Then <InlineMath>{'\\lim_{x\\to c}f(x) = L'}</InlineMath> as well.
          </p>
          <p>
            The canonical application is the limit <InlineMath>{'\\lim_{x\\to 0}\\sin x / x = 1'}</InlineMath>,
            which underpins the derivatives of all trig functions. The proof uses a geometric bound: for
            <InlineMath>{'\\;0 < x < \\pi/2'}</InlineMath>,
          </p>
          <DisplayMath>{String.raw`\cos x \;\le\; \frac{\sin x}{x} \;\le\; 1.`}</DisplayMath>
          <p>
            As <InlineMath>{'x \\to 0^+'}</InlineMath>, <InlineMath>{'\\cos x \\to 1'}</InlineMath>, so
            the squeeze forces <InlineMath>{'\\sin x / x \\to 1'}</InlineMath>. By symmetry the limit
            from the left is also 1, giving the two-sided limit.
          </p>
        </div>
      </section>

      {/* ── Interactive: Squeeze ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · SQUEEZE THEOREM VISUALIZER</span>
        </h2>
        <SqueezeWidget />
      </section>

      {/* ── Formalism: IVT ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · INTERMEDIATE VALUE THEOREM</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Intermediate Value Theorem (IVT).</strong> If <InlineMath>{'f'}</InlineMath> is
            continuous on <InlineMath>{'[a,b]'}</InlineMath> and <InlineMath>{'y_0'}</InlineMath> is any
            value strictly between <InlineMath>{'f(a)'}</InlineMath> and <InlineMath>{'f(b)'}</InlineMath>,
            then there exists <InlineMath>{'c \\in (a,b)'}</InlineMath> such that
            <InlineMath>{'\\;f(c) = y_0'}</InlineMath>.
          </p>
          <DisplayMath>{String.raw`f(a) \ne f(b) \;\wedge\; y_0 \text{ between } f(a), f(b) \;\Longrightarrow\; \exists\,c\in(a,b): f(c)=y_0.`}</DisplayMath>
          <p>
            The corollary most useful for root-finding: if <InlineMath>{'f(a) < 0 < f(b)'}</InlineMath>
            (or vice versa), then <InlineMath>{'f'}</InlineMath> has at least one root in
            <InlineMath>{'\\;(a,b)'}</InlineMath>. Bisection simply checks the sign of
            <InlineMath>{'\\;f'}</InlineMath> at the midpoint, discards the half with same sign, and
            repeats. The IVT guarantees a root exists in the surviving half at every step.
          </p>
          <div className="callout callout-warning">
            <strong>Continuity is essential.</strong> The IVT fails for discontinuous functions: the
            sign function <InlineMath>{'\\mathrm{sgn}(x)'}</InlineMath> has
            <InlineMath>{'\\;\\mathrm{sgn}(-1) = -1'}</InlineMath> and
            <InlineMath>{'\\;\\mathrm{sgn}(1) = 1'}</InlineMath>, but it never equals 0 on
            <InlineMath>{'\\;(-1,1)'}</InlineMath>. The sign function is not continuous at 0, which
            is precisely why the IVT does not apply.
          </div>
        </div>
      </section>

      {/* ── Formalism: MVT preview ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · MEAN VALUE THEOREM (PREVIEW)</span>
        </h2>
        <div className="content-block">
          <p>
            The Mean Value Theorem (MVT) — proved properly after we define derivatives in Lecture 34
            — states: if <InlineMath>{'f'}</InlineMath> is continuous on <InlineMath>{'[a,b]'}</InlineMath>
            and differentiable on <InlineMath>{'(a,b)'}</InlineMath>, then there exists
            <InlineMath>{'\\;c \\in (a,b)'}</InlineMath> such that
          </p>
          <DisplayMath>{String.raw`f'(c) = \frac{f(b)-f(a)}{b-a}.`}</DisplayMath>
          <p>
            Geometrically: the instantaneous slope at some interior point equals the average slope over
            the whole interval. The MVT is the foundation for proving convergence of numerical methods
            (error bounds on Euler's method, Lecture 36) and for L'Hôpital's rule (Lecture 34).
          </p>
        </div>
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · SQUEEZE FOR lim x² sin(1/x)</span>
        </h2>
        <div className="content-block">
          <p>
            Find <InlineMath>{'\\lim_{x\\to 0} x^2 \\sin(1/x)'}</InlineMath>. The function is undefined at
            <InlineMath>{'\\;x=0'}</InlineMath> and oscillates with increasing frequency, so direct
            substitution fails.
          </p>
          <p>
            Since <InlineMath>{'|\\sin\\theta| \\le 1'}</InlineMath> for all
            <InlineMath>{'\\;\\theta'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`-x^2 \;\le\; x^2\sin(1/x) \;\le\; x^2 \qquad (x \ne 0).`}</DisplayMath>
          <p>
            As <InlineMath>{'x \\to 0'}</InlineMath>, both <InlineMath>{'x^2 \\to 0'}</InlineMath> and
            <InlineMath>{'\\;-x^2 \\to 0'}</InlineMath>. By the Squeeze Theorem,
          </p>
          <DisplayMath>{String.raw`\lim_{x\to 0} x^2\sin(1/x) = 0.`}</DisplayMath>
          <p>
            Zoom in on the widget above to see both bounding parabolas collapsing onto the origin while the
            blue curve is forced to follow.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            <strong>Module 5 complete — ready for integration.</strong> You now have the four tools of
            pre-calculus and limits: bounding, functions &amp; composition, one-sided limits, and
            continuity &amp; the Squeeze Theorem. Module 6 uses all of them immediately: Riemann sums are
            limits of step-function approximations, and the Fundamental Theorem of Calculus connects
            integration and differentiation through continuity assumptions.
          </div>
        </div>
      </section>

      {/* ── Applications ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag apps-tag">ROBOTICS &amp; ML APPLICATIONS</span>
        </h2>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🔍</div>
              <h3>Bisection Root-Finding</h3>
              <p>
                Bisection (ROB 101, Lecture 17) is mathematically justified by the IVT: if a continuous
                inverse-kinematics or calibration residual changes sign on an interval, the algorithm is
                guaranteed to converge. Without continuity there is no guarantee.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧮</div>
              <h3>Lipschitz Continuity in ODEs</h3>
              <p>
                The Picard-Lindelöf theorem (Lecture 36) requires the ODE right-hand side to be
                Lipschitz continuous — a quantitative strengthening of plain continuity. Lipschitz bounds
                the local rate of change and prevents solutions from diverging in finite time.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📊</div>
              <h3>Activation Function Design</h3>
              <p>
                The hard-threshold step function is discontinuous at 0. Replacing it with a smooth
                sigmoid ensures continuity and differentiability — enabling gradient-based training.
                The Squeeze Theorem-style argument shows that smooth activations converge to step
                functions as their gain grows.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎯</div>
              <h3>Fixed-Point Iteration Guarantees</h3>
              <p>
                Banach's Fixed-Point Theorem (Lecture 48) requires a contraction mapping on a
                <em> complete</em> metric space. Continuity of the map is a prerequisite for the
                convergence proof — discrete update rules in reinforcement learning rely on exactly
                this structure.
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
            num={1} type="Concept"
            question="What are the three conditions required for f to be continuous at c?"
            options={[
              'f(c) is defined; lim_{x→c} f(x) exists; the limit equals f(c)',
              'f is differentiable at c; f(c) is finite; f is bounded near c',
              'f(c) is defined; the left limit exists; the right limit exists',
              'f is defined on an interval around c; f has no vertical asymptotes',
            ]}
            correct={0}
            explanation="Continuity at c requires: (i) f(c) must be defined, (ii) lim_{x→c} f(x) must exist (both one-sided limits agree), and (iii) the limit must equal f(c). If any one condition fails, f is discontinuous at c."
          />
          <QuizQ
            num={2} type="Computation"
            question="Use the Squeeze Theorem to evaluate lim_{x→0} x·cos(1/x)."
            options={[
              'The limit does not exist because cos(1/x) oscillates',
              '1',
              '0',
              'cos(0) = 1',
            ]}
            correct={2}
            explanation="Since |cos(θ)| ≤ 1 for all θ: −|x| ≤ x·cos(1/x) ≤ |x|. As x → 0, both ±|x| → 0. The Squeeze Theorem gives lim_{x→0} x·cos(1/x) = 0, even though cos(1/x) itself does not converge."
          />
          <QuizQ
            num={3} type="Concept"
            question="The IVT guarantees that a continuous f with f(0) = −3 and f(1) = 5 has a root in (0,1). What property of f is essential for this guarantee, and what happens if that property is violated?"
            options={[
              'Differentiability — without it the function may jump over zero',
              'Continuity — a discontinuous function can change sign without crossing zero',
              'Monotonicity — the function must be increasing to cross zero',
              'Boundedness — the function must not go to infinity',
            ]}
            correct={1}
            explanation="Continuity is the essential property. A continuous function cannot 'jump' from −3 to +5 without passing through every value in between, including 0. A discontinuous function can jump from negative to positive without ever equaling zero (e.g., sgn(x − 0.5) for f(0) = −1, f(1) = +1, yet f never equals 0 on (0,1))."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot joint encoder's output is a piecewise function: e(θ) = θ mod 2π, which 'wraps' from 2π back to 0 at each full revolution. Is e continuous? Can the IVT guarantee a root-finding algorithm based on encoder sign-changes?"
            options={[
              'e is continuous everywhere; IVT applies fully',
              'e has jump discontinuities at θ = 2πk (k integer); IVT does not apply across those jumps',
              'e is continuous since it is always in [0, 2π); IVT applies',
              'e is differentiable except at the wrap points; IVT still applies',
            ]}
            correct={1}
            explanation="e(θ) = θ mod 2π jumps from 2π to 0 at every full revolution. Those are discontinuities, so the IVT does not apply across them. A sign-based root-finding algorithm could spuriously detect a 'sign change' at a wrap-around point and fail. The fix is to unwrap the angle before applying bisection."
          />
        </div>
      </section>

      {/* ── Review ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag review-tag">SPACED REPETITION SCHEDULE</span>
        </h2>
        <div className="content-block">
          <div className="review-schedule">
            <div className="review-item">
              <span className="review-day">Day 0</span>
              State the three conditions for continuity at a point, the Squeeze Theorem, and the IVT
              from memory. Give a concrete example of each concept.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Apply the Squeeze Theorem to evaluate <InlineMath>{'\\lim_{x\\to 0}x^2\\cos(5/x)'}</InlineMath>.
              Write the bounding inequality and state the conclusion explicitly.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Give an example of a function that is (a) not continuous at a point but has both
              one-sided limits, (b) continuous but not differentiable. Classify each type of
              discontinuity.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              State the IVT and explain why the sign-function
              <InlineMath>{'\\;\\mathrm{sgn}(x)'}</InlineMath> does not satisfy its hypotheses on
              <InlineMath>{'\\;[-1, 1]'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes, explain the Squeeze Theorem in one sentence, sketch the
              <InlineMath>{'x^2 \\sin(1/x)'}</InlineMath> example, and state the IVT root-existence
              corollary.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
