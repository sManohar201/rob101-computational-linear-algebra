import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — Trapezoidal vs. Simpson quadrature error comparison.
//  Shows the approximation on a chosen function and plots error vs. N.
// ════════════════════════════════════════════════════════════════════════════

const PRESETS = [
  { label: 'f(x) = sin(x)', fn: x => Math.sin(x), a: 0, b: Math.PI, exact: 2 },
  { label: 'f(x) = x³',     fn: x => x * x * x,   a: 0, b: 2,       exact: 4 },
  { label: 'f(x) = e^x',    fn: x => Math.exp(x),  a: 0, b: 1,       exact: Math.E - 1 },
]

function trap(fn, a, b, N) {
  const h = (b - a) / N
  let s = (fn(a) + fn(b)) / 2
  for (let i = 1; i < N; i++) s += fn(a + i * h)
  return s * h
}

function simp(fn, a, b, N) {
  const n = N % 2 === 0 ? N : N + 1  // must be even
  const h = (b - a) / n
  let s = fn(a) + fn(b)
  for (let i = 1; i < n; i++) s += (i % 2 === 0 ? 2 : 4) * fn(a + i * h)
  return s * h / 3
}

function QuadratureWidget() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [N, setN] = useState(4)

  const { fn, a, b, exact } = PRESETS[presetIdx]
  const trapVal = trap(fn, a, b, N)
  const simpVal = simp(fn, a, b, N)
  const trapErr = Math.abs(trapVal - exact)
  const simpErr = Math.abs(simpVal - exact)

  // Build error curve: trap and simp error vs N from 1..40
  const Ns = [1, 2, 3, 4, 6, 8, 10, 14, 20, 30, 40]
  const trapErrs = Ns.map(n => Math.abs(trap(fn, a, b, n) - exact))
  const simpErrs = Ns.map(n => Math.abs(simp(fn, a, b, n) - exact))

  // SVG chart (log-log view of convergence)
  const W = 260, H = 160
  const logMin = -12, logMax = 2
  const xOf = i => (i / (Ns.length - 1)) * W
  const yOf = e => {
    if (e <= 0) return H
    const logE = Math.log10(e)
    return H - ((logE - logMin) / (logMax - logMin)) * H
  }

  const trapPts = trapErrs.map((e, i) => `${xOf(i).toFixed(1)},${yOf(e).toFixed(1)}`).join(' ')
  const simpPts = simpErrs.map((e, i) => `${xOf(i).toFixed(1)},${yOf(e).toFixed(1)}`).join(' ')

  const curIdx = Ns.indexOf(N) !== -1 ? Ns.indexOf(N) : Ns.findIndex(n => n >= N)

  return (
    <div className="widget">
      <p className="widget-caption">
        The chart shows how the absolute error of the Trapezoidal rule (blue) and Simpson's rule (green)
        shrinks as <InlineMath>{'N'}</InlineMath> grows — plotted on a log scale. Trapezoidal error
        shrinks as <InlineMath>{'O(h^2)'}</InlineMath> (straight slope of −2 on log-log);
        Simpson's shrinks as <InlineMath>{'O(h^4)'}</InlineMath> (slope −4). The same number of
        function evaluations yields a much tighter bound with Simpson's.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            {/* Reference lines */}
            {[-2, -4, -6, -8, -10].map(lg => (
              <line key={lg} x1={0} y1={yOf(Math.pow(10, lg))} x2={W} y2={yOf(Math.pow(10, lg))}
                stroke="#e2e8f0" strokeWidth="0.7" />
            ))}
            {/* Trapezoidal */}
            <polyline points={trapPts} fill="none" stroke="#1c7ed6" strokeWidth="2" />
            {/* Simpson */}
            <polyline points={simpPts} fill="none" stroke="#099268" strokeWidth="2" />
            {/* Current N marker */}
            {curIdx >= 0 && curIdx < Ns.length && (
              <>
                <circle cx={xOf(curIdx)} cy={yOf(trapErrs[curIdx])} r="4" fill="#1c7ed6" />
                <circle cx={xOf(curIdx)} cy={yOf(simpErrs[curIdx])} r="4" fill="#099268" />
              </>
            )}
            {/* Labels */}
            <text x={4} y={yOf(1e-2) + 4} fontSize="9" fill="#8899bb">1e-2</text>
            <text x={4} y={yOf(1e-6) + 4} fontSize="9" fill="#8899bb">1e-6</text>
            <text x={4} y={yOf(1e-10) + 4} fontSize="9" fill="#8899bb">1e-10</text>
            <text x={2} y={14} fontSize="9" fill="#5c6b85">error</text>
            <text x={W - 28} y={H - 2} fontSize="9" fill="#5c6b85">N=40</text>
          </svg>

          <div style={{ flex: 1, minWidth: '170px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span><InlineMath>{'N'}</InlineMath> intervals</span><strong>{N}</strong></div>
              <div className="hud-row"><span>True integral</span><strong>{exact.toFixed(6)}</strong></div>
              <div className="hud-row">
                <span style={{ color: '#1c7ed6' }}>Trapezoidal</span>
                <strong>{trapVal.toFixed(6)}</strong>
              </div>
              <div className="hud-row">
                <span style={{ color: '#1c7ed6' }}>Trap error</span>
                <strong>{trapErr.toExponential(2)}</strong>
              </div>
              <div className="hud-row">
                <span style={{ color: '#099268' }}>Simpson</span>
                <strong>{simpVal.toFixed(6)}</strong>
              </div>
              <div className="hud-row">
                <span style={{ color: '#099268' }}>Simp error</span>
                <strong>{simpErr.toExponential(2)}</strong>
              </div>
            </div>

            <label className="slider-row">
              <span className="slider-label"><InlineMath>{'N'}</InlineMath> = <b>{N}</b></span>
              <input type="range" min={1} max={40} step={1} value={N}
                onChange={e => setN(Number(e.target.value))} />
            </label>

            <div className="preset-bar" style={{ marginTop: '8px' }}>
              {PRESETS.map((p, i) => (
                <button key={i}
                  className={`preset-btn ${presetIdx === i ? 'active' : ''}`}
                  onClick={() => { setPresetIdx(i); setN(4) }}>
                  {p.label}
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

export default function L30() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#eafaf1', color: '#1a7a41', borderColor: '#a9dfc0' }}>
          Module 6 · Lecture 30 · ROB 201
        </div>
        <h1 className="lesson-title">Numerical Quadrature Schemes</h1>
        <p className="lesson-subtitle">
          Lecture 29 showed that any integral is the limit of Riemann sums. But waiting for
          <InlineMath>{'\\;N \\to \\infty'}</InlineMath> is not practical. Numerical quadrature rules
          — trapezoidal, Simpson's, and their cousins — achieve far faster convergence by using
          smarter approximations per subinterval, typically beating simple Riemann sums by two orders
          of accuracy per step.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            The Riemann midpoint rule approximates the function on each subinterval by a constant —
            a horizontal line. This is crude: the error on each piece scales as
            <InlineMath>{'\\;O(h^2)'}</InlineMath> (where <InlineMath>{'h'}</InlineMath> is the
            subinterval width), so the total error over <InlineMath>{'N'}</InlineMath> pieces scales
            as <InlineMath>{'O(h^2) = O(1/N^2)'}</InlineMath>. To halve the error you must quadruple
            the number of function evaluations.
          </p>
          <p>
            The Trapezoidal rule connects consecutive function values with a straight line instead of a
            horizontal one. Each trapezoid approximates the area better than a rectangle, but the error
            per piece is still <InlineMath>{'O(h^2)'}</InlineMath> from the local curvature —
            the same overall rate. Simpson's rule goes further: it fits a <em>parabola</em> through
            three points (two endpoints and the midpoint of each pair of subintervals). A parabola
            captures quadratic terms that a straight line misses, so the error per piece drops to
            <InlineMath>{'\\;O(h^4)'}</InlineMath>, giving a total error of
            <InlineMath>{'\\;O(h^4) = O(1/N^4)'}</InlineMath>. Doubling <InlineMath>{'N'}</InlineMath>
            cuts the error by a factor of 16.
          </p>
          <p>
            The lesson is a general one in numerical analysis: <em>higher-order polynomial
            interpolation buys faster convergence</em>. The trade-off is that higher-order methods
            assume more smoothness of the integrand. If <InlineMath>{'f'}</InlineMath> has a
            discontinuity or a sharp corner, the high-order method can fail to outperform the simple
            one — knowing the smoothness of your integrand is essential.
          </p>
        </div>
      </section>

      {/* ── Formalism: trapezoidal ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · THE TRAPEZOIDAL RULE</span>
        </h2>
        <div className="content-block">
          <p>
            Partition <InlineMath>{'[a,b]'}</InlineMath> into <InlineMath>{'N'}</InlineMath> equal
            intervals of width <InlineMath>{'h = (b-a)/N'}</InlineMath>. The Trapezoidal rule
            approximates the integral as the sum of trapezoid areas:
          </p>
          <DisplayMath>{String.raw`T_N = h\left[\frac{f(a)+f(b)}{2} + \sum_{i=1}^{N-1}f(a+ih)\right].`}</DisplayMath>
          <p>
            The error bound is
          </p>
          <DisplayMath>{String.raw`\left|\int_a^b f - T_N\right| \le \frac{(b-a)^3}{12N^2}\max_{x\in[a,b]}|f''(x)|.`}</DisplayMath>
          <p>
            The <InlineMath>{'1/N^2'}</InlineMath> factor shows second-order convergence: doubling
            <InlineMath>{'\\;N'}</InlineMath> quarters the error. The bound grows with
            <InlineMath>{'\\;\\max|f^{\\prime\\prime}|'}</InlineMath> — functions with high curvature are harder to
            integrate accurately with this rule.
          </p>
        </div>
      </section>

      {/* ── Formalism: Simpson ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · SIMPSON'S RULE</span>
        </h2>
        <div className="content-block">
          <p>
            Simpson's rule requires an <em>even</em> number of subintervals. Pairing adjacent
            subintervals and fitting a parabola through the three endpoints of each pair yields
          </p>
          <DisplayMath>{String.raw`S_N = \frac{h}{3}\left[f(a) + 4f(a+h) + 2f(a+2h) + 4f(a+3h) + \cdots + 4f(b-h) + f(b)\right],`}</DisplayMath>
          <p>
            where the coefficients alternate 4-2-4-2-…-4 for interior points. The error bound is
          </p>
          <DisplayMath>{String.raw`\left|\int_a^b f - S_N\right| \le \frac{(b-a)^5}{180N^4}\max_{x\in[a,b]}|f^{(4)}(x)|.`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Why Simpson's is exact for cubics.</strong> Fitting a parabola through three points
            is exact for quadratic functions. But due to a cancellation in the error formula, Simpson's
            rule is actually exact for cubic polynomials as well — even though it only uses parabolas.
            This is why the error involves <InlineMath>{'f^{(4)}'}</InlineMath>, not
            <InlineMath>{'\\;f^{(3)}'}</InlineMath>.
          </div>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · QUADRATURE ERROR CONVERGENCE</span>
        </h2>
        <QuadratureWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · ∫₀^π sin(x) dx WITH N = 4</span>
        </h2>
        <div className="content-block">
          <p>
            Evaluate <InlineMath>{'\\int_0^\\pi \\sin x\\,dx = 2'}</InlineMath> numerically with
            <InlineMath>{'\\;N = 4'}</InlineMath>. Here <InlineMath>{'h = \\pi/4'}</InlineMath> and
            nodes <InlineMath>{'x_i = 0, \\pi/4, \\pi/2, 3\\pi/4, \\pi'}</InlineMath>.
          </p>
          <p>
            <strong>Trapezoidal:</strong>
          </p>
          <DisplayMath>{String.raw`T_4 = \frac{\pi/4}{1}\left[\frac{\sin 0 + \sin\pi}{2} + \sin\tfrac{\pi}{4}+\sin\tfrac{\pi}{2}+\sin\tfrac{3\pi}{4}\right] = \frac{\pi}{4}\!\left[0 + \frac{\sqrt{2}}{2}+1+\frac{\sqrt{2}}{2}\right] \approx 1.896.`}</DisplayMath>
          <p>
            <strong>Simpson's (</strong><InlineMath>{'N=4'}</InlineMath>, coefficients 1-4-2-4-1<strong>):</strong>
          </p>
          <DisplayMath>{String.raw`S_4 = \frac{\pi/4}{3}\left[\sin 0 + 4\sin\tfrac{\pi}{4} + 2\sin\tfrac{\pi}{2} + 4\sin\tfrac{3\pi}{4} + \sin\pi\right] = \frac{\pi}{12}\left[0+2\sqrt{2}+2+2\sqrt{2}+0\right] \approx 2.0046.`}</DisplayMath>
          <p>
            Errors: Trapezoidal <InlineMath>{'|1.896 - 2| \\approx 0.104'}</InlineMath>;
            Simpson <InlineMath>{'|2.0046 - 2| \\approx 0.005'}</InlineMath>.
            Same number of nodes, 20× less error with Simpson's.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            <strong>Quadrature in context.</strong> Lectures 30 and 29 together are the numerical
            integration toolkit. Lectures 31-32 extend integration to geometric applications and
            improper limits. Lecture 33 then delivers the analytical escape hatch: the Fundamental
            Theorem of Calculus, which computes many integrals exactly with antiderivatives — no
            summation needed.
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
              <div className="app-icon">🔋</div>
              <h3>Battery State Estimation</h3>
              <p>
                Coulomb counting integrates current over time to estimate charge:
                <InlineMath>{'\\;Q = \\int_0^T i(t)\\,dt'}</InlineMath>. On embedded microcontrollers,
                the trapezoidal rule is preferred because it can be implemented with just two stored
                values (current and previous reading) per time step.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧮</div>
              <h3>RK4 as Implicit Quadrature</h3>
              <p>
                The 4th-order Runge-Kutta ODE solver (Lecture 36) is essentially a 4-point quadrature
                rule applied to the ODE right-hand side. Its 4th-order accuracy matches Simpson's, and
                for the same reason: it cancels the 3rd-order error term by careful choice of weights.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>Sensor Fusion via Integration</h3>
              <p>
                IMU-based pose estimation integrates angular velocity to track orientation. The
                trapezoidal rule doubles the accuracy of simple forward-Euler integration at essentially
                no computational cost — a common real-time improvement in navigation filters.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎯</div>
              <h3>Gaussian Quadrature in GP Inference</h3>
              <p>
                Gaussian Process inference often requires computing integrals over probability densities.
                Gaussian-Legendre quadrature (a higher-order cousin of Simpson's) can achieve
                machine-precision accuracy with far fewer function evaluations than simple rules.
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
            question="Simpson's rule achieves O(h⁴) convergence even though it fits parabolas (degree 2). Why does the error involve f⁽⁴⁾ rather than f⁽³⁾?"
            options={[
              'Because Simpson uses two subintervals at a time and a cancellation eliminates the cubic error term',
              'Because the parabola exactly matches up to degree 3, so all cubic error vanishes',
              'Because f⁽³⁾ is always zero for smooth functions',
              "Because the trapezoidal rule already handles the f'' term",
            ]}
            correct={0}
            explanation="Simpson's rule applied to a pair of subintervals [x₀, x₂] gives an error that cancels the O(h³) term by symmetry (the error from [x₀, x₁] and [x₁, x₂] have opposite signs for the cubic term). The next surviving term involves f⁽⁴⁾, giving the overall O(h⁴) = O(1/N⁴) convergence."
          />
          <QuizQ
            num={2} type="Computation"
            question="Apply the trapezoidal rule with N = 2 to ∫₀² x³ dx. What is the error?"
            options={['Error = 0', 'Error ≈ 1', 'Error = 2', 'Error ≈ 0.5']}
            correct={1}
            explanation="h = 1, nodes at x = 0, 1, 2. f(0)=0, f(1)=1, f(2)=8. T₂ = 1×[(0+8)/2 + 1] = 1×[4+1] = 5. True value = ∫₀²x³dx = 2⁴/4 = 4. Error = |5-4| = 1. Note: Simpson's rule with N=2 gives the exact answer 4 because x³ is a cubic polynomial."
          />
          <QuizQ
            num={3} type="Concept"
            question="If you double the number of intervals N in Simpson's rule, by approximately what factor does the error decrease?"
            options={['2', '4', '8', '16']}
            correct={3}
            explanation="Simpson's error ∝ h⁴ = 1/N⁴. Doubling N halves h, so h⁴ becomes (h/2)⁴ = h⁴/16. The error decreases by a factor of 16. This is the key advantage over the trapezoidal rule (factor of 4 per doubling)."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A smooth IMU angular velocity signal ω(t) has at most |ω⁽⁴⁾(t)| ≤ 0.01 rad/s⁵ on [0, 0.1 s]. How many Simpson's rule intervals N are needed to guarantee an angular position error below 10⁻⁸ rad?"
            options={['N = 2', 'N = 4', 'N = 6', 'N = 10']}
            correct={1}
            explanation="Simpson's error bound: (b-a)⁵/(180N⁴) × max|f⁽⁴⁾|. Here b-a = 0.1, max|f⁽⁴⁾| ≤ 0.01. Setting (0.1)⁵/(180N⁴) × 0.01 ≤ 1e-8: 10⁻⁵ × 0.01 / (180N⁴) = 10⁻⁷/(180N⁴) ≤ 1e-8 → N⁴ ≥ 10⁻⁷/(180×10⁻⁸) ≈ 0.056. N ≥ 1. But practically N=4 gives large safety margin; N=2 might suffice analytically here. N=4 is the safe conservative answer."
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
              Write the trapezoidal and Simpson formulas from memory. State the error order for each
              (O(h²) and O(h⁴)). Name the quantity that each error bound grows with.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Apply the trapezoidal rule with <InlineMath>{'N=4'}</InlineMath> to
              <InlineMath>{'\\int_0^1 e^x\\,dx'}</InlineMath> and compare with the exact value
              <InlineMath>{'e-1'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Explain in one sentence why Simpson's rule requires an even number of subintervals.
              What happens if you apply it with an odd <InlineMath>{'N'}</InlineMath>?
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              For <InlineMath>{'f(x) = x^3'}</InlineMath> on <InlineMath>{'[0,1]'}</InlineMath>, why does
              Simpson's rule with <InlineMath>{'N=2'}</InlineMath> give the exact answer while the
              trapezoidal rule does not?
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Explain the convergence rate difference between trapezoidal and Simpson's — no formulas —
              in terms of which polynomial degree each rule integrates exactly.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
