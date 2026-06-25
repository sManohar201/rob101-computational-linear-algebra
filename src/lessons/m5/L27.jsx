import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — One-sided limits at a jump discontinuity.
//  A piecewise function f(x) = x+1 for x<2, f(x)=5-(x-2) for x≥2.
//  A probe point x approaches c=2 from either side; the widget shows
//  the left-hand limit and right-hand limit separately.
// ════════════════════════════════════════════════════════════════════════════

// f(x) = x+1 for x<2, 5-(x-2) for x≥2  → jump at x=2: L-=3, L+=5
const f = x => x < 2 ? x + 1 : 5 - (x - 2)

// A vertical asymptote example: g(x)=1/(x-2)^2 (only for inset)
// We visualize f with a jump, and also let user switch to a 1/x^2-style asym example

const EXAMPLES = [
  {
    label: 'Jump discontinuity',
    fn: (x) => x < 2 ? x + 1 : 5 - (x - 2),
    c: 2,
    leftLim: 3,
    rightLim: 5,
    yMin: 0,
    yMax: 6.5,
    xMin: -0.5,
    xMax: 4.5,
  },
  {
    label: 'One-sided from left only',
    fn: (x) => x < 3 ? Math.sqrt(3 - x) : null,
    c: 3,
    leftLim: 0,
    rightLim: null,
    yMin: -0.5,
    yMax: 2.5,
    xMin: -0.5,
    xMax: 4.5,
  },
]

function LimitsWidget() {
  const [exIdx, setExIdx] = useState(0)
  const [approach, setApproach] = useState(0.5)  // 0=from left, 1=from right, 0.5=none

  const ex = EXAMPLES[exIdx]
  const { fn, c, leftLim, rightLim, yMin, yMax, xMin, xMax } = ex

  // SVG dimensions
  const W = 280, H = 200
  const px = (x) => ((x - xMin) / (xMax - xMin)) * W
  const py = (y) => H - ((y - yMin) / (yMax - yMin)) * H

  // Build polyline for the function, split at discontinuity
  const steps = 120
  const leftPts = [], rightPts = []
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin)
    if (Math.abs(x - c) < 0.02) continue
    const y = fn(x)
    if (y === null || !isFinite(y) || y < yMin - 0.5 || y > yMax + 0.5) continue
    if (x < c - 0.01) leftPts.push(`${px(x).toFixed(1)},${py(y).toFixed(1)}`)
    else if (x > c + 0.01) rightPts.push(`${px(x).toFixed(1)},${py(y).toFixed(1)}`)
  }

  // Probe positions
  const probeX = approach < 0.5 ? c - (0.5 - approach) * 2 * 0.9 : c + (approach - 0.5) * 2 * 0.9
  const probeY = fn(probeX)
  const probeValid = probeY !== null && isFinite(probeY)

  const leftVal = leftLim !== null ? leftLim.toFixed(3) : '—'
  const rightVal = rightLim !== null ? rightLim.toFixed(3) : '—'
  const twoSided = leftLim !== null && rightLim !== null && Math.abs(leftLim - rightLim) < 1e-9 ? leftLim.toFixed(3) : 'does not exist'

  return (
    <div className="widget">
      <p className="widget-caption">
        Each example shows a piecewise function near a target point <InlineMath>{'c'}</InlineMath>. The
        slider moves a probe toward <InlineMath>{'c'}</InlineMath> — from the left (
        <InlineMath>{'x \\to c^-'}</InlineMath>) or the right (<InlineMath>{'x \\to c^+'}</InlineMath>).
        Watch the probe value approach the one-sided limit. The two-sided limit exists only when both
        one-sided limits are equal.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            {/* Axes */}
            <line x1={px(xMin)} y1={py(0)} x2={px(xMax)} y2={py(0)} stroke="#ccd3de" strokeWidth="1" />
            <line x1={px(0)} y1={0} x2={px(0)} y2={H} stroke="#ccd3de" strokeWidth="1" />
            {/* x-axis labels */}
            <text x={px(c) - 4} y={py(0) + 12} fontSize="9" fill="#8899bb">c={c}</text>

            {/* Left branch */}
            {leftPts.length > 1 && <polyline points={leftPts.join(' ')} fill="none" stroke="#1c7ed6" strokeWidth="2" />}
            {/* Right branch */}
            {rightPts.length > 1 && <polyline points={rightPts.join(' ')} fill="none" stroke="#1c7ed6" strokeWidth="2" />}

            {/* Open circles at discontinuity */}
            {leftLim !== null && (
              <circle cx={px(c)} cy={py(leftLim)} r="4" fill="#f4f8fd" stroke="#1c7ed6" strokeWidth="2" />
            )}
            {rightLim !== null && (
              <circle cx={px(c)} cy={py(rightLim)} r="4" fill="#1c7ed6" stroke="#1c7ed6" strokeWidth="2" />
            )}

            {/* Dashed vertical line at c */}
            <line x1={px(c)} y1={0} x2={px(c)} y2={H}
              stroke="#e8590c" strokeWidth="1" strokeDasharray="4 3" />

            {/* Probe dot */}
            {probeValid && approach !== 0.5 && (
              <>
                <circle cx={px(probeX)} cy={py(probeY)} r="5" fill="#c92a2a" />
                <line x1={px(probeX)} y1={py(probeY)} x2={px(probeX)} y2={py(0)}
                  stroke="#c92a2a" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
              </>
            )}

            {/* Limit labels */}
            {leftLim !== null && (
              <text x={px(c) + 6} y={py(leftLim) + 4} fontSize="9" fill="#099268">L⁻={leftLim}</text>
            )}
            {rightLim !== null && rightLim !== leftLim && (
              <text x={px(c) + 6} y={py(rightLim) - 3} fontSize="9" fill="#e8590c">L⁺={rightLim}</text>
            )}
          </svg>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span>Target point <InlineMath>{'c'}</InlineMath></span><strong>{c}</strong></div>
              <div className="hud-row">
                <span><InlineMath>{'\\lim_{x\\to c^-}'}</InlineMath></span>
                <strong style={{ color: '#099268' }}>{leftVal}</strong>
              </div>
              <div className="hud-row">
                <span><InlineMath>{'\\lim_{x\\to c^+}'}</InlineMath></span>
                <strong style={{ color: '#e8590c' }}>{rightVal}</strong>
              </div>
              <div className="hud-row">
                <span>Two-sided limit</span>
                <strong style={{ color: twoSided === 'does not exist' ? '#c92a2a' : '#099268' }}>
                  {twoSided}
                </strong>
              </div>
              {probeValid && approach !== 0.5 && (
                <div className="hud-row">
                  <span>Probe: x = {probeX.toFixed(3)}</span>
                  <strong style={{ color: '#c92a2a' }}>f(x) = {probeY.toFixed(3)}</strong>
                </div>
              )}
            </div>

            <div style={{ margin: '8px 0 4px', fontSize: '12px', color: '#5c6b85' }}>
              Approach from:
            </div>
            <label className="slider-row">
              <span className="slider-label">
                {approach < 0.45 ? 'Left (x → c⁻)' : approach > 0.55 ? 'Right (x → c⁺)' : 'center'}
              </span>
              <input type="range" min={0} max={1} step={0.01} value={approach}
                onChange={e => setApproach(Number(e.target.value))} />
            </label>

            <div className="preset-bar" style={{ marginTop: '8px' }}>
              {EXAMPLES.map((ex, i) => (
                <button key={i}
                  className={`preset-btn ${exIdx === i ? 'active' : ''}`}
                  onClick={() => { setExIdx(i); setApproach(0.5) }}>
                  {ex.label}
                </button>
              ))}
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

export default function L27() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#fef3e8', color: '#b05e0a', borderColor: '#fad5a5' }}>
          Module 5 · Lecture 27 · ROB 201
        </div>
        <h1 className="lesson-title">Finite One-Sided &amp; Two-Sided Limits</h1>
        <p className="lesson-subtitle">
          Before derivatives or integrals can be defined, we need to make precise what it means for a
          function to "approach" a value. The limit is that idea — and distinguishing the left-hand limit
          from the right-hand limit is what lets us analyze piecewise functions, discontinuities, and the
          boundaries of every integral we compute in Module 6.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Think about a robot navigating a hallway that ends in a wall at position
            <InlineMath>{'\\;x = c'}</InlineMath>. The robot's sensor can measure the gap to the wall as
            it approaches from the left, getting readings closer and closer to zero — but the wall itself
            blocks the sensor at exactly <InlineMath>{'x = c'}</InlineMath>. The <em>limit</em> of the
            sensor reading as <InlineMath>{'x \\to c^-'}</InlineMath> is well-defined even though the
            function value at <InlineMath>{'c'}</InlineMath> is undefined (or has a completely different
            meaning — the robot has crashed). This is exactly the left-hand limit.
          </p>
          <p>
            A piecewise-defined function is the natural setting for limits. Consider a thermostat
            controller: below <InlineMath>{'20°'}</InlineMath>C it outputs maximum heating; at and above
            <InlineMath>{'\\;20°'}</InlineMath>C it switches to cooling. The control output has a
            <em> jump</em> at <InlineMath>{'20°'}</InlineMath>. The left-hand limit and right-hand limit
            both exist — but they are different. The two-sided limit does not exist at that point, which
            is why a thermostat cannot be modeled with a simple continuous function.
          </p>
          <p>
            The concept of a limit is foundational because derivatives and integrals are defined as limits.
            The derivative is the limit of a difference quotient; the integral is the limit of Riemann sums.
            This lecture gives us the formal language to state those definitions precisely in Lectures 33–34.
          </p>
        </div>
      </section>

      {/* ── Formalism: one-sided limits ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · ONE-SIDED LIMITS</span>
        </h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{'f'}</InlineMath> be defined on some punctured neighborhood of
            <InlineMath>{'\\;c'}</InlineMath>. The <strong>left-hand limit</strong> is
          </p>
          <DisplayMath>{String.raw`\lim_{x \to c^-} f(x) = L^- \quad \iff \quad \forall\,\varepsilon>0,\;\exists\,\delta>0 : c-\delta<x<c \Rightarrow |f(x)-L^-|<\varepsilon.`}</DisplayMath>
          <p>
            Informally: we can make <InlineMath>{'f(x)'}</InlineMath> arbitrarily close to
            <InlineMath>{'\\;L^-'}</InlineMath> by taking <InlineMath>{'x'}</InlineMath> close enough
            to <InlineMath>{'c'}</InlineMath> from the left. The <strong>right-hand limit</strong>
            <InlineMath>{'\\;L^+'}</InlineMath> is defined symmetrically, with
            <InlineMath>{'\\;c < x < c + \\delta'}</InlineMath>.
          </p>
          <p>
            The two-sided limit <InlineMath>{'\\lim_{x\\to c} f(x) = L'}</InlineMath> exists if and only
            if both one-sided limits exist and are equal:
          </p>
          <DisplayMath>{String.raw`\lim_{x\to c}f(x) = L \quad\iff\quad L^- = L^+ = L.`}</DisplayMath>
          <div className="callout callout-warning">
            <strong>The limit is not the function value.</strong> The limit
            <InlineMath>{'\\;\\lim_{x\\to c}f(x)'}</InlineMath> describes what
            <InlineMath>{'\\;f(x)'}</InlineMath> approaches as <InlineMath>{'x'}</InlineMath> nears
            <InlineMath>{'\\;c'}</InlineMath> — it says nothing about the value
            <InlineMath>{'\\;f(c)'}</InlineMath> itself. The function might not even be defined at
            <InlineMath>{'\\;c'}</InlineMath>. Continuity (Lecture 28) is precisely the property that
            the limit and the function value agree.
          </div>
        </div>
      </section>

      {/* ── Formalism: limit laws ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · LIMIT LAWS</span>
        </h2>
        <div className="content-block">
          <p>
            If <InlineMath>{'\\lim_{x\\to c}f(x) = L'}</InlineMath> and
            <InlineMath>{'\\;\\lim_{x\\to c}g(x) = M'}</InlineMath>, then limits distribute over the
            standard arithmetic operations:
          </p>
          <DisplayMath>{String.raw`\lim_{x\to c}[f(x)\pm g(x)] = L\pm M, \qquad \lim_{x\to c}[f(x)\cdot g(x)] = L\cdot M,`}</DisplayMath>
          <DisplayMath>{String.raw`\lim_{x\to c}\frac{f(x)}{g(x)} = \frac{L}{M} \;\;(M\ne 0), \qquad \lim_{x\to c}[cf(x)] = cL.`}</DisplayMath>
          <p>
            These laws reduce the computation of complicated limits to limits of simpler pieces — provided
            we know the pieces converge. The tricky cases are <InlineMath>{'0/0'}</InlineMath> or
            <InlineMath>{'\\;\\infty/\\infty'}</InlineMath> indeterminate forms, which L'Hôpital's rule
            (Lecture 34) handles.
          </p>
        </div>
      </section>

      {/* ── Formalism: asymptotes ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · INFINITE LIMITS &amp; ASYMPTOTES</span>
        </h2>
        <div className="content-block">
          <p>
            A function has a <strong>vertical asymptote</strong> at <InlineMath>{'c'}</InlineMath> if
            <InlineMath>{'|f(x)| \\to \\infty'}</InlineMath> as <InlineMath>{'x \\to c'}</InlineMath> from
            either side. For example, <InlineMath>{'f(x) = 1/(x-c)^2'}</InlineMath> blows up to
            <InlineMath>{'\\;+\\infty'}</InlineMath> on both sides. A
            <strong> horizontal asymptote</strong> at <InlineMath>{'L'}</InlineMath> means
            <InlineMath>{'\\lim_{x\\to\\pm\\infty}f(x) = L'}</InlineMath>. In Lecture 32 we will use
            asymptotic behavior to classify whether improper integrals converge or diverge.
          </p>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · ONE-SIDED LIMITS AT A JUMP</span>
        </h2>
        <LimitsWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · COMPUTING ONE-SIDED LIMITS</span>
        </h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{'f(x) = \\begin{cases} x+1 & x < 2 \\\\ 5-(x-2) & x \\ge 2 \\end{cases}'}</InlineMath>.
            Compute the one-sided limits at <InlineMath>{'c = 2'}</InlineMath>.
          </p>
          <p>
            <strong>Left-hand limit:</strong> approach from values <InlineMath>{'x < 2'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\lim_{x\to 2^-}f(x) = \lim_{x\to 2^-}(x+1) = 2+1 = 3.`}</DisplayMath>
          <p>
            <strong>Right-hand limit:</strong> approach from values <InlineMath>{'x > 2'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\lim_{x\to 2^+}f(x) = \lim_{x\to 2^+}[5-(x-2)] = 5-(2-2) = 5.`}</DisplayMath>
          <p>
            Since <InlineMath>{'L^- = 3 \\ne 5 = L^+'}</InlineMath>, the two-sided limit does not exist
            at <InlineMath>{'c = 2'}</InlineMath>. The function has a jump discontinuity of magnitude
            <InlineMath>{'\\;|5-3| = 2'}</InlineMath> there. (Observe this in the first preset of the
            widget above.)
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            <strong>Limit machinery in place.</strong> We can now state what it means for a function to
            approach a value from one or both sides, apply limit laws, and identify when limits fail to
            exist. Lecture 28 immediately uses this machinery to define <em>continuity</em> (the limit
            exists, equals the function value, and the function is defined there), prove the Squeeze
            Theorem, and establish the Intermediate Value Theorem — the tool we use to guarantee that
            bisection root-finding always works.
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
              <div className="app-icon">🌡️</div>
              <h3>Piecewise Controller Switching</h3>
              <p>
                Hybrid controllers switch between modes (e.g., free-space motion vs. contact force
                control) at a boundary condition. The one-sided limits of the controller output at the
                switching surface determine whether the transition is smooth or introduces an impact
                impulse.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚡</div>
              <h3>ReLU and Activation Limits</h3>
              <p>
                The ReLU activation <InlineMath>{'\\max(0, x)'}</InlineMath> has one-sided limits
                <InlineMath>{'\\;L^- = 0'}</InlineMath> and <InlineMath>{'L^+ = 0'}</InlineMath> at
                <InlineMath>{'\\;x=0'}</InlineMath> (equal, so the two-sided limit exists and equals 0),
                but its <em>derivative</em> has a jump there — the left derivative is 0, the right
                derivative is 1. That jump is why subgradients are needed for ReLU.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>Sensor Saturation</h3>
              <p>
                A proximity sensor clips at its maximum range: <InlineMath>{'f(d) = \\min(d, d_{\\max})'}</InlineMath>.
                At <InlineMath>{'d = d_{\\max}'}</InlineMath>, the left and right limits of
                <InlineMath>{'\\;f'}</InlineMath> agree (both equal <InlineMath>{'d_{\\max}'}</InlineMath>),
                but the left derivative is 1 and the right derivative is 0 — a corner, not a jump.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔄</div>
              <h3>Numerical ODE Step-Size Limits</h3>
              <p>
                The accuracy of Forward Euler (Lecture 36) is analyzed via the limit of the local
                truncation error as step size <InlineMath>{'h \\to 0^+'}</InlineMath>. That the limit
                exists and equals zero is the definition of <em>consistency</em> — the first requirement
                for a stable numerical integrator.
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
            question="What is the key difference between the limit lim_{x→c} f(x) and the function value f(c)?"
            options={[
              'The limit requires f to be defined at c, but the function value does not',
              'The limit describes what f(x) approaches as x gets close to c, regardless of whether f(c) exists or what it equals',
              'The limit and the function value are always equal by definition',
              'The limit only applies to continuous functions',
            ]}
            correct={1}
            explanation="The limit lim_{x→c} f(x) = L means f(x) gets arbitrarily close to L as x → c, but makes no claim about f(c) — f may be undefined at c, or f(c) may differ from L. Continuity (Lecture 28) is exactly the property that the limit equals the function value."
          />
          <QuizQ
            num={2} type="Computation"
            question="For f(x) = |x|/x (the sign function, ±1), what are lim_{x→0⁻} f(x) and lim_{x→0⁺} f(x)?"
            options={[
              'Both limits equal 0',
              'L⁻ = −1, L⁺ = +1',
              'L⁻ = +1, L⁺ = −1',
              'Neither limit exists',
            ]}
            correct={1}
            explanation="For x < 0: |x|/x = (−x)/x = −1, so L⁻ = −1. For x > 0: |x|/x = x/x = +1, so L⁺ = +1. The two-sided limit does not exist because L⁻ ≠ L⁺."
          />
          <QuizQ
            num={3} type="Concept"
            question="If lim_{x→c⁻} f(x) = 4 and lim_{x→c⁺} f(x) = 4, but f(c) = 7, does lim_{x→c} f(x) exist? What is it?"
            options={[
              'The limit does not exist because f(c) ≠ 4',
              'The limit exists and equals 7 (the function value)',
              'The limit exists and equals 4, regardless of the function value at c',
              'The limit is undefined when f(c) ≠ L',
            ]}
            correct={2}
            explanation="The two-sided limit exists when L⁻ = L⁺ = 4, regardless of f(c). The limit equals 4. The function value f(c) = 7 means the function is not continuous at c (it has a removable discontinuity), but the limit still exists."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot controller is defined as u(e) = 5 for e > 0.1, u(e) = −5 for e < −0.1, and u(e) = 50e for |e| ≤ 0.1. Does lim_{e→0.1} u(e) exist?"
            options={[
              'Yes, it equals 5',
              'No — the left limit is 5 (from the linear region: 50×0.1 = 5) and the right limit is 5 (saturated), so actually yes, it equals 5',
              'No — the left limit is 50×0.1 = 5 and the right limit is 5, but they are the same so the limit exists and equals 5',
              'The limit is 50×0.1 = 5 from the left, and 5 from the right; the two-sided limit exists and equals 5',
            ]}
            correct={3}
            explanation="Approaching e = 0.1 from the left (e < 0.1): u = 50e → 50×0.1 = 5. From the right (e > 0.1): u = 5. Both one-sided limits equal 5, so the two-sided limit exists and equals 5. The controller transitions smoothly in limit at the saturation boundary."
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
              State the ε-δ definitions of the left-hand limit and two-sided limit from memory. Draw a
              sketch of a jump discontinuity and label <InlineMath>{'L^-'}</InlineMath>,
              <InlineMath>{'\\;L^+'}</InlineMath>, and <InlineMath>{'f(c)'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Compute <InlineMath>{'\\lim_{x\\to 1^\\pm}(x^2 - 1)/(x-1)'}</InlineMath>. Explain why the
              two-sided limit exists even though the expression is 0/0 at <InlineMath>{'x=1'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              State the four limit laws (sum, product, quotient, scalar). Give an example where the
              quotient law fails and explain why.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Without notes, classify the discontinuity of <InlineMath>{'f(x) = \\text{sgn}(x)'}</InlineMath>
              at <InlineMath>{'x=0'}</InlineMath>: do the one-sided limits exist? Do they agree? What is
              <InlineMath>{'f(0)'}</InlineMath>?
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Explain in under 2 minutes what a limit is, why the function value at
              <InlineMath>{'\\;c'}</InlineMath> is irrelevant to the limit, and why the two-sided limit
              requires both one-sided limits to agree.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
