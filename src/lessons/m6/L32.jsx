import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — Improper integral tail bounding using comparison.
//  Shows f(x) = 1/xᵖ and a comparison function on [1,∞), and plots the
//  partial integral ∫₁ᵀ f(x) dx as T → ∞.
// ════════════════════════════════════════════════════════════════════════════

function ImproperWidget() {
  const [p, setP] = useState(1.5)  // ∫₁^∞ 1/x^p dx converges iff p > 1
  const [T, setT] = useState(10)   // upper limit

  // Partial integral ∫₁ᵀ 1/xᵖ dx
  const partialIntegral = p === 1
    ? Math.log(T)
    : (Math.pow(T, 1 - p) - 1) / (1 - p)

  const trueIntegral = p > 1 ? 1 / (p - 1) : null
  const converges = p > 1

  // SVG: show 1/x^p and the running integral value
  const W = 260, H = 160
  const xMin = 1, xMax = Math.min(T, 15)
  const fn = x => Math.pow(x, -p)

  const px = x => ((x - xMin) / (xMax - xMin)) * (W - 10) + 5
  const py = y => H - 10 - Math.min(y * (H - 20), H - 10)

  const curvePts = []
  for (let i = 0; i <= 150; i++) {
    const x = xMin + (i / 150) * (xMax - xMin)
    const y = fn(x)
    if (y < 3) curvePts.push(`${px(x).toFixed(1)},${py(y).toFixed(1)}`)
  }

  // Fill area under curve
  const fillPath = curvePts.length > 1
    ? `M ${px(xMin).toFixed(1)},${py(0).toFixed(1)} L ${curvePts.join(' L ')} L ${px(xMax).toFixed(1)},${py(0).toFixed(1)} Z`
    : ''

  return (
    <div className="widget">
      <p className="widget-caption">
        The shaded area shows <InlineMath>{'\\int_1^T x^{-p}\\,dx'}</InlineMath> as
        <InlineMath>{'\\;T'}</InlineMath> grows. Set <InlineMath>{'p > 1'}</InlineMath> and watch
        the running integral converge to a finite value as <InlineMath>{'T \\to \\infty'}</InlineMath>.
        Set <InlineMath>{'p \\le 1'}</InlineMath> and watch it diverge to
        <InlineMath>{'\\;\\infty'}</InlineMath>. The p-series test encodes this threshold exactly.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            {/* Axes */}
            <line x1={5} y1={py(0)} x2={W - 5} y2={py(0)} stroke="#8899bb" strokeWidth="1" />
            <line x1={5} y1={10} x2={5} y2={H - 10} stroke="#8899bb" strokeWidth="1" />
            {/* Filled area */}
            {fillPath && (
              <path d={fillPath}
                fill={converges ? 'rgba(9,146,104,0.2)' : 'rgba(201,42,42,0.2)'}
                stroke="none" />
            )}
            {/* Curve */}
            {curvePts.length > 1 && (
              <polyline points={curvePts.join(' ')} fill="none"
                stroke={converges ? '#099268' : '#c92a2a'} strokeWidth="2" />
            )}
            {/* Labels */}
            <text x={8} y={H - 12} fontSize="9" fill="#5c6b85">x=1</text>
            <text x={W - 30} y={H - 12} fontSize="9" fill="#5c6b85">T={xMax}</text>
            <text x={8} y={18} fontSize="9" fill="#5c6b85">1/x^p</text>
          </svg>

          <div style={{ flex: 1, minWidth: '170px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span><InlineMath>{'p'}</InlineMath></span><strong>{p.toFixed(2)}</strong></div>
              <div className="hud-row"><span><InlineMath>{'T'}</InlineMath></span><strong>{T}</strong></div>
              <div className="hud-row">
                <span><InlineMath>{'\\int_1^T x^{-p}\\,dx'}</InlineMath></span>
                <strong>{partialIntegral.toFixed(4)}</strong>
              </div>
              <div className="hud-row">
                <span>True limit as <InlineMath>{'T\\to\\infty'}</InlineMath></span>
                <strong style={{ color: converges ? '#099268' : '#c92a2a' }}>
                  {trueIntegral !== null ? trueIntegral.toFixed(4) : '∞ (diverges)'}
                </strong>
              </div>
              <div className="hud-row">
                <span>Integral</span>
                <strong style={{ color: converges ? '#099268' : '#c92a2a' }}>
                  {converges ? 'CONVERGES' : 'DIVERGES'}
                </strong>
              </div>
            </div>
            <label className="slider-row">
              <span className="slider-label"><InlineMath>{'p'}</InlineMath> = <b>{p.toFixed(2)}</b></span>
              <input type="range" min={0.3} max={3} step={0.05} value={p}
                onChange={e => setP(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label"><InlineMath>{'T'}</InlineMath> = <b>{T}</b></span>
              <input type="range" min={2} max={200} step={1} value={T}
                onChange={e => setT(Number(e.target.value))} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L32() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#eafaf1', color: '#1a7a41', borderColor: '#a9dfc0' }}>
          Module 6 · Lecture 32 · ROB 201
        </div>
        <h1 className="lesson-title">Improper Integrals &amp; Probability Densities</h1>
        <p className="lesson-subtitle">
          Some integrals have infinite limits or an integrand that blows up — yet still converge to a
          finite value. These <em>improper integrals</em> are not pathological edge cases; they are
          the foundation of probability distributions, the Laplace transform, and moment computations
          for infinite-horizon control problems.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Can an infinite region have a finite area? The answer is yes — if the function tapers to zero
            fast enough. The classic example is <InlineMath>{'\\int_1^\\infty 1/x^2\\,dx = 1'}</InlineMath>:
            the area under the reciprocal-square curve from 1 to infinity is exactly 1. But
            <InlineMath>{'\\int_1^\\infty 1/x\\,dx'}</InlineMath> diverges — the harmonic series grows
            without bound, just barely. The difference between <InlineMath>{'p = 1'}</InlineMath> and
            <InlineMath>{'p = 1.01'}</InlineMath> is the difference between convergence and divergence.
          </p>
          <p>
            This subtlety matters enormously in probability theory. A probability density function (PDF)
            must integrate to 1 over its full domain. For distributions defined on
            <InlineMath>{'\\;(-\\infty, \\infty)'}</InlineMath> — like the Gaussian — the integral is
            improper on both sides. The fact that it converges (to exactly 1, by construction) is the
            whole validity of the probabilistic model. Kalman filters, Bayesian estimation, and
            maximum-likelihood optimization all rest on this foundation.
          </p>
          <p>
            Similarly, the Laplace transform — which converts an ODE into algebra (Lecture 38) — is
            defined as <InlineMath>{'\\int_0^\\infty e^{-st} f(t)\\,dt'}</InlineMath>. For this to
            exist, the exponential damping <InlineMath>{'e^{-st}'}</InlineMath> must outpace the growth
            of <InlineMath>{'f(t)'}</InlineMath>. The condition for convergence of this improper integral
            determines the region of convergence in the complex <InlineMath>{'s'}</InlineMath>-plane.
          </p>
        </div>
      </section>

      {/* ── Formalism: type I ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · TYPE I — INFINITE LIMITS</span>
        </h2>
        <div className="content-block">
          <p>
            A <strong>Type I improper integral</strong> has an infinite limit of integration. It is
            defined as a limit of proper integrals:
          </p>
          <DisplayMath>{String.raw`\int_a^{\infty}f(x)\,dx = \lim_{T\to\infty}\int_a^T f(x)\,dx.`}</DisplayMath>
          <p>
            The integral <strong>converges</strong> if this limit is finite; otherwise it
            <strong> diverges</strong>. The canonical family is the <strong>p-series</strong>:
          </p>
          <DisplayMath>{String.raw`\int_1^\infty \frac{1}{x^p}\,dx = \begin{cases} \dfrac{1}{p-1} & p > 1 \\ +\infty & p \le 1 \end{cases}`}</DisplayMath>
          <p>
            The critical threshold <InlineMath>{'p = 1'}</InlineMath> is exactly the boundary between
            convergence and divergence. This is the integral analogue of the result that the harmonic
            series <InlineMath>{'\\sum 1/n'}</InlineMath> diverges while
            <InlineMath>{'\\;\\sum 1/n^2'}</InlineMath> converges.
          </p>
        </div>
      </section>

      {/* ── Formalism: type II ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · TYPE II — VERTICAL ASYMPTOTES</span>
        </h2>
        <div className="content-block">
          <p>
            A <strong>Type II improper integral</strong> occurs when the integrand blows up at a point
            inside or at the boundary of the interval. If <InlineMath>{'f'}</InlineMath> has a vertical
            asymptote at <InlineMath>{'b'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\int_a^b f(x)\,dx = \lim_{\varepsilon\to 0^+}\int_a^{b-\varepsilon}f(x)\,dx.`}</DisplayMath>
          <p>
            For example, <InlineMath>{'\\int_0^1 x^{-1/2}\\,dx = 2'}</InlineMath> converges despite the
            blowup at 0, while <InlineMath>{'\\int_0^1 x^{-1}\\,dx'}</InlineMath> diverges (logarithmic
            blowup is too slow to integrate).
          </p>
          <div className="callout callout-success">
            <strong>Comparison test.</strong> If <InlineMath>{'0 \\le f(x) \\le g(x)'}</InlineMath>
            on <InlineMath>{'[a,\\infty)'}</InlineMath> and <InlineMath>{'\\int_a^\\infty g'}</InlineMath>
            converges, then <InlineMath>{'\\int_a^\\infty f'}</InlineMath> converges as well. If
            <InlineMath>{'\\int_a^\\infty f'}</InlineMath> diverges, then
            <InlineMath>{'\\int_a^\\infty g'}</InlineMath> also diverges (the larger function cannot
            converge if the smaller one doesn't). The p-series serves as the go-to comparison benchmark.
          </div>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · p-SERIES CONVERGENCE</span>
        </h2>
        <ImproperWidget />
      </section>

      {/* ── Formalism: PDFs ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · PROBABILITY DENSITY FUNCTIONS</span>
        </h2>
        <div className="content-block">
          <p>
            A <strong>probability density function</strong> (PDF) <InlineMath>{'f_X : \\mathbb{R} \\to [0,\\infty)'}</InlineMath>
            must satisfy the normalization condition:
          </p>
          <DisplayMath>{String.raw`\int_{-\infty}^{\infty} f_X(x)\,dx = 1.`}</DisplayMath>
          <p>
            This is an improper integral on both ends. The Gaussian distribution
          </p>
          <DisplayMath>{String.raw`\mathcal{N}(x;\,\mu,\sigma^2) = \frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)`}</DisplayMath>
          <p>
            satisfies this because <InlineMath>{'\\int_{-\\infty}^\\infty e^{-x^2/2}\\,dx = \\sqrt{2\\pi}'}</InlineMath>
            — a classic improper integral proved by switching to polar coordinates. The
            <InlineMath>{'\\;1/(\\sigma\\sqrt{2\\pi})'}</InlineMath> prefactor is exactly what is
            needed to normalize the exponential.
          </p>
          <p>
            Absolutely integrable functions satisfy
            <InlineMath>{'\\;\\int |f(x)|\\,dx < \\infty'}</InlineMath>. This is slightly stronger than
            the integral existing as a limit — a function can have a convergent integral yet not be
            absolutely integrable (oscillating integrands like
            <InlineMath>{'\\;\\sin(x)/x'}</InlineMath>). For PDFs, non-negativity makes absolute
            integrability automatic.
          </p>
        </div>
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · EVALUATING AN EXPONENTIAL PDF</span>
        </h2>
        <div className="content-block">
          <p>
            The exponential distribution <InlineMath>{'f(x) = \\lambda e^{-\\lambda x}'}</InlineMath>
            for <InlineMath>{'x \\ge 0'}</InlineMath> (0 elsewhere) models waiting times (time between
            sensor events, inter-arrival of messages). Verify it is a valid PDF:
          </p>
          <DisplayMath>{String.raw`\int_0^\infty \lambda e^{-\lambda x}\,dx = \lambda\lim_{T\to\infty}\left[-\frac{1}{\lambda}e^{-\lambda x}\right]_0^T = \lim_{T\to\infty}\!\left[-e^{-\lambda T}+1\right] = 1. \;\checkmark`}</DisplayMath>
          <p>
            Compute the mean <InlineMath>{'\\mu = \\int_0^\\infty x\\,\\lambda e^{-\\lambda x}\\,dx'}</InlineMath>
            by integration by parts (Lecture 33):
            <InlineMath>{'\\;\\mu = 1/\\lambda'}</InlineMath>. The larger the rate
            <InlineMath>{'\\;\\lambda'}</InlineMath>, the shorter the expected waiting time.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            <strong>Module 6 complete.</strong> You can now evaluate proper integrals (Lectures 29–30),
            apply integration to geometry and dynamics (Lecture 31), and handle improper integrals and
            PDFs (Lecture 32). Module 7 delivers the analytical antiderivative toolkit — integration by
            parts, u-substitution, and partial fractions — and then the derivative, Taylor series, and
            automatic differentiation.
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
              <div className="app-icon">🎲</div>
              <h3>Gaussian Sensor Noise Model</h3>
              <p>
                GPS, LIDAR, and IMU noise are commonly modeled as Gaussian:
                <InlineMath>{'\\;\\varepsilon \\sim \\mathcal{N}(0, \\sigma^2)'}</InlineMath>. The
                normalization condition <InlineMath>{'\\int_{-\\infty}^\\infty f(x)\\,dx = 1'}</InlineMath>
                is what makes the Kalman filter's probabilistic update equations valid.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📊</div>
              <h3>Laplace Transform Region of Convergence</h3>
              <p>
                The Laplace transform <InlineMath>{'\\mathcal{L}\\{f\\}(s) = \\int_0^\\infty e^{-st}f(t)\\,dt'}</InlineMath>
                is a Type I improper integral. For exponential signals
                <InlineMath>{'\\;f(t) = e^{at}'}</InlineMath>, it converges only if
                <InlineMath>{'\\;\\text{Re}(s) > a'}</InlineMath> — the region of convergence in the
                s-plane (Lecture 38).
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔁</div>
              <h3>Discounted Reward in RL</h3>
              <p>
                Continuous-time discounted reward
                <InlineMath>{'\\;J = \\int_0^\\infty e^{-\\gamma t} r(x(t))\\,dt'}</InlineMath>
                is an improper integral. Convergence requires
                <InlineMath>{'\\;|r|'}</InlineMath> to grow slower than
                <InlineMath>{'\\;e^{\\gamma t}'}</InlineMath> — the exponential discount factor acts
                as the comparison function in the convergence test.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>Sensor Reliability Modeling</h3>
              <p>
                The probability that an ultrasonic sensor fails before time <InlineMath>{'T'}</InlineMath>
                is <InlineMath>{'\\int_0^T \\lambda e^{-\\lambda t}\\,dt'}</InlineMath> (exponential
                distribution). The improper integral as <InlineMath>{'T\\to\\infty'}</InlineMath>
                equals 1, confirming that failure eventually occurs with certainty.
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
            question="∫₁^∞ 1/x dx diverges, but ∫₁^∞ 1/x² dx = 1 converges. What makes the difference?"
            options={[
              '1/x² is a more complicated function than 1/x',
              '1/x decays too slowly (logarithmic area growth) while 1/x² decays fast enough (power p = 2 > 1) for the tail area to be finite',
              '1/x is not integrable because it has a singularity at x = 0',
              'The integrals on [0,1] are different, which affects [1,∞)',
            ]}
            correct={1}
            explanation="The p-series test: ∫₁^∞ 1/xᵖ dx converges iff p > 1. For p = 1: ∫₁ᵀ 1/x dx = ln T → ∞. For p = 2: ∫₁ᵀ 1/x² dx = 1 − 1/T → 1. The function 1/x tapers too slowly — it looks like it's going to zero, but the accumulated tail keeps growing logarithmically."
          />
          <QuizQ
            num={2} type="Computation"
            question="Evaluate ∫₀^∞ e^(−3x) dx."
            options={['1/3', '3', '∞', '1']}
            correct={0}
            explanation="∫₀ᵀ e^(−3x) dx = [−(1/3)e^(−3x)]₀ᵀ = −(1/3)e^(−3T) + 1/3. As T → ∞, e^(−3T) → 0, so the limit is 1/3. This is the Laplace transform of the constant function 1 evaluated at s = 3."
          />
          <QuizQ
            num={3} type="Concept"
            question="A function f is a valid probability density function on [0,∞). Which conditions must it satisfy?"
            options={[
              'f(x) ≥ 0 for all x ≥ 0, and ∫₀^∞ f(x) dx = 1',
              'f is differentiable and f(x) > 0 for all x > 0',
              'f is continuous and its maximum value is 1',
              'f(x) ≤ 1 for all x and ∫₀^∞ f(x) dx = 1',
            ]}
            correct={0}
            explanation="A valid PDF must be non-negative everywhere (f(x) ≥ 0 — negative probabilities are meaningless) and must integrate to 1 (total probability = 100%). Differentiability and continuity are helpful but not required by the definition."
          />
          <QuizQ
            num={4} type="Transfer"
            question="The Laplace transform of f(t) = sin(t) is ∫₀^∞ e^(−st) sin(t) dt. For what values of s does this improper integral converge?"
            options={[
              's > 0 (the real part of s must be positive)',
              's > 1',
              's > −1',
              'All complex s with |s| > 1',
            ]}
            correct={0}
            explanation="sin(t) is bounded (|sin(t)| ≤ 1), so for convergence we need e^(−st)·|sin(t)| → 0 as t → ∞. This requires e^(−Re(s)t) → 0, i.e., Re(s) > 0. So the Laplace transform of sin(t) converges for Re(s) > 0, and equals 1/(s²+1) there."
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
              State the definitions of Type I and Type II improper integrals as limits of proper
              integrals. State the p-series convergence result.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Evaluate <InlineMath>{'\\int_0^\\infty e^{-2x}\\,dx'}</InlineMath> and
              <InlineMath>{'\\int_0^1 x^{-1/2}\\,dx'}</InlineMath> from the limit definition. Identify
              which type each is.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Apply the comparison test to show that
              <InlineMath>{'\\int_1^\\infty e^{-x}/\\sqrt{x}\\,dx'}</InlineMath> converges, using
              <InlineMath>{'\\;e^{-x}/\\sqrt{x} \\le e^{-x}'}</InlineMath> for <InlineMath>{'x\\ge 1'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Write the normalization condition for a PDF. Verify that
              <InlineMath>{'f(x) = \\lambda e^{-\\lambda x}'}</InlineMath> for
              <InlineMath>{'x\\ge 0'}</InlineMath> satisfies it, and compute the mean
              <InlineMath>{'\\mu = 1/\\lambda'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Explain without notes: what makes an improper integral converge vs. diverge, state the
              comparison test, and name two engineering quantities defined by improper integrals.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
