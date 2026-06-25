import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET — Riemann sum visualizer.
//  Shows upper and lower Darboux sums for a chosen function on [a,b].
//  Slider controls number of subintervals N.
// ════════════════════════════════════════════════════════════════════════════

const PRESETS = [
  { label: 'f(x) = x²',      fn: x => x * x,               a: 0, b: 2 },
  { label: 'f(x) = sin(x)',   fn: x => Math.sin(x),         a: 0, b: Math.PI },
  { label: 'f(x) = √x',      fn: x => Math.sqrt(x),         a: 0, b: 4 },
  { label: 'f(x) = e^(−x²)', fn: x => Math.exp(-x * x),    a: -2, b: 2 },
]

function RiemannWidget() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [N, setN] = useState(6)
  const [sumType, setSumType] = useState('upper')  // 'upper' | 'lower' | 'midpoint'

  const { fn, a, b } = PRESETS[presetIdx]
  const dx = (b - a) / N

  // Compute sums
  let lower = 0, upper = 0, mid = 0
  const rects = []
  for (let i = 0; i < N; i++) {
    const x0 = a + i * dx
    const x1 = x0 + dx
    const xm = (x0 + x1) / 2

    // sample function densely on sub-interval for min/max
    const samples = 40
    let lo = Infinity, hi = -Infinity
    for (let j = 0; j <= samples; j++) {
      const v = fn(x0 + j * dx / samples)
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
    lower += lo * dx
    upper += hi * dx
    mid += fn(xm) * dx
    rects.push({ x0, x1, lo, hi, xm })
  }

  // Exact integral (only available analytically for the presets — approximate via fine sampling)
  const exactSamples = 10000
  let exactIntegral = 0
  const exDx = (b - a) / exactSamples
  for (let i = 0; i < exactSamples; i++) exactIntegral += fn(a + (i + 0.5) * exDx) * exDx

  // SVG dimensions
  const W = 280, H = 180
  const xPad = 24, yPad = 16

  // Find y range
  const allY = rects.flatMap(r => [r.lo, r.hi])
  const yMin = Math.min(0, ...allY) - 0.1
  const yMax = Math.max(...allY) + 0.3

  const px = x => xPad + ((x - a) / (b - a)) * (W - xPad - 8)
  const py = y => (H - yPad) - ((y - yMin) / (yMax - yMin)) * (H - yPad - 8)

  // Build smooth curve
  const curvePts = []
  for (let i = 0; i <= 200; i++) {
    const x = a + (i / 200) * (b - a)
    curvePts.push(`${px(x).toFixed(1)},${py(fn(x)).toFixed(1)}`)
  }

  const shownSum = sumType === 'upper' ? upper : sumType === 'lower' ? lower : mid

  return (
    <div className="widget">
      <p className="widget-caption">
        The shaded rectangles are the Darboux partition. <strong>Upper sum</strong> (red) uses the
        maximum of <InlineMath>{'f'}</InlineMath> on each subinterval; <strong>lower sum</strong>
        (blue) uses the minimum; <strong>midpoint</strong> (green) uses the midpoint value. As
        <InlineMath>{'\\;N'}</InlineMath> grows all three converge to the true integral.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <svg width={W} height={H}
            style={{ background: '#f4f8fd', borderRadius: '8px', flexShrink: 0 }}>
            {/* Rectangles */}
            {rects.map((r, i) => {
              const rectH = sumType === 'upper' ? r.hi : sumType === 'lower' ? r.lo : fn(r.xm)
              const rectY = py(Math.max(rectH, 0))
              const rectH2 = Math.abs(py(0) - py(rectH))
              const fill = sumType === 'upper' ? 'rgba(201,42,42,0.25)' :
                           sumType === 'lower' ? 'rgba(28,126,214,0.25)' :
                           'rgba(9,146,104,0.25)'
              const stroke = sumType === 'upper' ? '#c92a2a' :
                             sumType === 'lower' ? '#1c7ed6' : '#099268'
              return (
                <rect key={i}
                  x={px(r.x0)} y={rectY}
                  width={px(r.x1) - px(r.x0) - 0.5}
                  height={rectH2}
                  fill={fill} stroke={stroke} strokeWidth="0.8" />
              )
            })}
            {/* Axes */}
            <line x1={xPad} y1={py(0)} x2={W - 4} y2={py(0)} stroke="#8899bb" strokeWidth="1" />
            <line x1={xPad} y1={8} x2={xPad} y2={H - yPad} stroke="#8899bb" strokeWidth="1" />
            {/* Curve */}
            <polyline points={curvePts.join(' ')} fill="none" stroke="#2c3e50" strokeWidth="2" />
            {/* Labels */}
            <text x={px(a) - 2} y={py(0) + 12} fontSize="9" fill="#5c6b85">{a.toFixed(1)}</text>
            <text x={px(b) - 4} y={py(0) + 12} fontSize="9" fill="#5c6b85">{b.toFixed(1)}</text>
          </svg>

          <div style={{ flex: 1, minWidth: '170px' }}>
            <div className="hud-panel">
              <div className="hud-row"><span>Subintervals <InlineMath>{'N'}</InlineMath></span><strong>{N}</strong></div>
              <div className="hud-row">
                <span style={{ color: '#c92a2a' }}>Upper sum <InlineMath>{'U_N'}</InlineMath></span>
                <strong>{upper.toFixed(4)}</strong>
              </div>
              <div className="hud-row">
                <span style={{ color: '#1c7ed6' }}>Lower sum <InlineMath>{'L_N'}</InlineMath></span>
                <strong>{lower.toFixed(4)}</strong>
              </div>
              <div className="hud-row">
                <span style={{ color: '#099268' }}>Midpoint</span>
                <strong>{mid.toFixed(4)}</strong>
              </div>
              <div className="hud-row"><span>True integral</span><strong style={{ color: '#c92a2a' }}>≈ {exactIntegral.toFixed(4)}</strong></div>
              <div className="hud-row">
                <span>Gap <InlineMath>{'U_N - L_N'}</InlineMath></span>
                <strong>{(upper - lower).toFixed(4)}</strong>
              </div>
            </div>

            <label className="slider-row">
              <span className="slider-label"><InlineMath>{'N'}</InlineMath> = <b>{N}</b></span>
              <input type="range" min={1} max={80} step={1} value={N}
                onChange={e => setN(Number(e.target.value))} />
            </label>

            <div style={{ display: 'flex', gap: '6px', margin: '8px 0' }}>
              {['upper', 'lower', 'midpoint'].map(t => (
                <button key={t}
                  className={`preset-btn ${sumType === t ? 'active' : ''}`}
                  style={{ fontSize: '11px' }}
                  onClick={() => setSumType(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="preset-bar">
              {PRESETS.map((p, i) => (
                <button key={i}
                  className={`preset-btn ${presetIdx === i ? 'active' : ''}`}
                  onClick={() => { setPresetIdx(i); setN(6) }}>
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

export default function L29() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#eafaf1', color: '#1a7a41', borderColor: '#a9dfc0' }}>
          Module 6 · Lecture 29 · ROB 201
        </div>
        <h1 className="lesson-title">Definite Integrals &amp; Riemann Sums</h1>
        <p className="lesson-subtitle">
          The definite integral is the precise answer to the question: what is the net area between a
          function and the horizontal axis? The Riemann-Darboux approach defines it as the common limit
          of upper and lower sums — turning an infinite process into a single number, with all the
          limit machinery of Module 5 now in service.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Suppose a robot is moving along a track with a known velocity profile
            <InlineMath>{'\\;v(t)'}</InlineMath>. How far does it travel between
            <InlineMath>{'\\;t = 0'}</InlineMath> and <InlineMath>{'\\;t = T'}</InlineMath>?
            If velocity were constant, the answer is trivial: distance = velocity × time. But when
            velocity varies — as it always does in practice — we need a way to accumulate the
            contributions from each instant. The integral does exactly this.
          </p>
          <p>
            The historical insight — independently reached by Newton and Leibniz — was to approximate
            the curved area by stacking thin rectangles. Each rectangle has width
            <InlineMath>{'\\;\\Delta t'}</InlineMath> (a small time interval) and height
            <InlineMath>{'\\;v(t_i)'}</InlineMath> (the velocity at some sample point in that interval).
            Add up all the rectangle areas and take the limit as
            <InlineMath>{'\\;\\Delta t \\to 0'}</InlineMath>. Riemann made this rigorous; Darboux
            sharpened it by using the minimum and maximum of <InlineMath>{'f'}</InlineMath> on each
            subinterval to get bounds from below and above simultaneously.
          </p>
          <p>
            The bounding philosophy from Lecture 25 reappears here: the lower Darboux sum
            <InlineMath>{'\\;L_N'}</InlineMath> underestimates the true integral, the upper sum
            <InlineMath>{'\\;U_N'}</InlineMath> overestimates it, and they both converge to the same
            limit as <InlineMath>{'N \\to \\infty'}</InlineMath> — that common limit is the definite
            integral.
          </p>
        </div>
      </section>

      {/* ── Formalism: Darboux sums ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · DARBOUX UPPER AND LOWER SUMS</span>
        </h2>
        <div className="content-block">
          <p>
            Let <InlineMath>{'f: [a,b] \\to \\mathbb{R}'}</InlineMath> be bounded. A
            <strong> partition</strong> <InlineMath>{'\\mathcal{P}'}</InlineMath> of <InlineMath>{'[a,b]'}</InlineMath>
            is a finite sequence <InlineMath>{'a = x_0 < x_1 < \\cdots < x_N = b'}</InlineMath>. On each
            subinterval <InlineMath>{'[x_{i-1}, x_i]'}</InlineMath> define
          </p>
          <DisplayMath>{String.raw`m_i = \inf_{x\in[x_{i-1},x_i]}f(x), \qquad M_i = \sup_{x\in[x_{i-1},x_i]}f(x).`}</DisplayMath>
          <p>
            The <strong>lower Darboux sum</strong> and <strong>upper Darboux sum</strong> are
          </p>
          <DisplayMath>{String.raw`L(\mathcal{P},f) = \sum_{i=1}^N m_i\,\Delta x_i, \qquad U(\mathcal{P},f) = \sum_{i=1}^N M_i\,\Delta x_i,`}</DisplayMath>
          <p>
            where <InlineMath>{'\\Delta x_i = x_i - x_{i-1}'}</InlineMath>. Since
            <InlineMath>{'\\;m_i \\le f(x) \\le M_i'}</InlineMath> on each interval:
          </p>
          <DisplayMath>{String.raw`L(\mathcal{P},f) \;\le\; \int_a^b f(x)\,dx \;\le\; U(\mathcal{P},f).`}</DisplayMath>
        </div>
      </section>

      {/* ── Formalism: definition of integral ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · THE DEFINITE INTEGRAL</span>
        </h2>
        <div className="content-block">
          <p>
            A bounded function <InlineMath>{'f'}</InlineMath> is <strong>Riemann integrable</strong> on
            <InlineMath>{'\\;[a,b]'}</InlineMath> if
          </p>
          <DisplayMath>{String.raw`\sup_{\mathcal{P}} L(\mathcal{P},f) = \inf_{\mathcal{P}} U(\mathcal{P},f).`}</DisplayMath>
          <p>
            That common value is the <strong>definite integral</strong>
            <InlineMath>{'\\int_a^b f(x)\\,dx'}</InlineMath>. Every continuous function is Riemann
            integrable. For an equal-width partition with <InlineMath>{'N'}</InlineMath> subintervals and
            mesh <InlineMath>{'\\Delta x = (b-a)/N'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\int_a^b f(x)\,dx = \lim_{N\to\infty}\sum_{i=1}^N f(x_i^*)\,\Delta x,`}</DisplayMath>
          <p>
            where <InlineMath>{'x_i^*'}</InlineMath> is any sample point in <InlineMath>{'[x_{i-1},x_i]'}</InlineMath>
            (left endpoint, right endpoint, midpoint, etc.) — the limit is the same for any choice.
          </p>
          <div className="callout callout-success">
            <strong>Key properties of the definite integral.</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
              <li><strong>Linearity:</strong> <InlineMath>{'\\int_a^b [\\alpha f + \\beta g] = \\alpha\\int_a^b f + \\beta\\int_a^b g'}</InlineMath></li>
              <li><strong>Interval additivity:</strong> <InlineMath>{'\\int_a^b f = \\int_a^c f + \\int_c^b f'}</InlineMath> for any <InlineMath>{'c \\in [a,b]'}</InlineMath></li>
              <li><strong>Sign:</strong> if <InlineMath>{'f \\ge 0'}</InlineMath> on <InlineMath>{'[a,b]'}</InlineMath> then <InlineMath>{'\\int_a^b f \\ge 0'}</InlineMath></li>
              <li><strong>Reversal:</strong> <InlineMath>{'\\int_b^a f = -\\int_a^b f'}</InlineMath></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · RIEMANN SUM PARTITIONS</span>
        </h2>
        <RiemannWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · ∫₀² x² dx</span>
        </h2>
        <div className="content-block">
          <p>
            Evaluate <InlineMath>{'\\int_0^2 x^2\\,dx'}</InlineMath> using right-endpoint Riemann sums.
            Partition <InlineMath>{'[0,2]'}</InlineMath> into <InlineMath>{'N'}</InlineMath> equal
            subintervals: <InlineMath>{'\\Delta x = 2/N'}</InlineMath>,
            <InlineMath>{'\\;x_i = 2i/N'}</InlineMath>.
          </p>
          <DisplayMath>{String.raw`\sum_{i=1}^N f(x_i)\,\Delta x = \sum_{i=1}^N \left(\frac{2i}{N}\right)^2 \cdot \frac{2}{N} = \frac{8}{N^3}\sum_{i=1}^N i^2 = \frac{8}{N^3}\cdot\frac{N(N+1)(2N+1)}{6}.`}</DisplayMath>
          <p>
            Taking <InlineMath>{'N \\to \\infty'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\int_0^2 x^2\,dx = \lim_{N\to\infty}\frac{8}{N^3}\cdot\frac{N(N+1)(2N+1)}{6} = \frac{8}{6}\cdot 2 = \frac{8}{3}.`}</DisplayMath>
          <p>
            Verify in the widget above: with <InlineMath>{'f(x)=x^2'}</InlineMath> and large
            <InlineMath>{'\\;N'}</InlineMath>, the sums should converge to approximately
            <InlineMath>{'\\;2.667'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            <strong>Next: computable quadrature and the Fundamental Theorem.</strong> Computing limits of
            Riemann sums by hand is tedious. Lecture 30 introduces numerical quadrature rules (trapezoidal,
            Simpson's) that beat simple Riemann sums on convergence rate. Lecture 33 establishes the
            Fundamental Theorem of Calculus — the tool that lets us evaluate any integral analytically
            by finding an antiderivative, skipping the sum altogether.
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
              <div className="app-icon">🤖</div>
              <h3>Dead-Reckoning Position</h3>
              <p>
                A robot integrates its IMU accelerometer readings over time to estimate position.
                Numerically, <InlineMath>{'\\;x(T) = \\int_0^T v(t)\\,dt'}</InlineMath> is a Riemann sum
                at each control cycle — each step adds velocity × time step to the running position total.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚡</div>
              <h3>Energy Dissipation</h3>
              <p>
                The energy dissipated by a resistor in a circuit is
                <InlineMath>{'\\;E = \\int_0^T i^2(t) R\\,dt'}</InlineMath>. In motor control, computing
                this integral over a duty cycle gives the thermal load — critical for not burning out
                actuators.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📉</div>
              <h3>Loss Function Gradients</h3>
              <p>
                Continuous-time policy gradient methods in reinforcement learning optimize the expected
                discounted return <InlineMath>{'\\;\\int_0^\\infty \\gamma^t r(t)\\,dt'}</InlineMath>.
                The integral is approximated via Monte Carlo rollouts — a stochastic Riemann sum.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧮</div>
              <h3>State Transition via Integration</h3>
              <p>
                ODE solvers (Forward Euler, RK4, Lecture 36) advance the system state by computing
                <InlineMath>{'\\;x(t+h) \\approx x(t) + \\int_t^{t+h} f(x,\\tau)\\,d\\tau'}</InlineMath>
                — each solver differs in how it approximates this integral.
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
            question="What property of a function guarantees it is Riemann integrable?"
            options={[
              'Differentiability on [a, b]',
              'Continuity on [a, b] (which implies boundedness and that sup lower sums = inf upper sums)',
              'Monotonicity on [a, b]',
              'Finiteness of the function at every rational point',
            ]}
            correct={1}
            explanation="Every continuous function on a closed bounded interval is Riemann integrable. Continuity implies boundedness and ensures that the oscillation of f on each subinterval → 0 as the mesh → 0, which forces U_N − L_N → 0."
          />
          <QuizQ
            num={2} type="Computation"
            question="For f(x) = 3 on [0, 5], what is ∫₀⁵ 3 dx using the definition (no antiderivatives)?"
            options={['3', '5', '15', '8']}
            correct={2}
            explanation="For a constant function f(x) = 3, every Riemann sum gives the same value: N × (3) × (5/N) = 15. The limit is 15. Geometrically, the integral is the area of a rectangle of height 3 and width 5."
          />
          <QuizQ
            num={3} type="Concept"
            question="The upper Darboux sum U_N always overestimates the true integral. As N → ∞, what happens to U_N − L_N for a continuous function?"
            options={[
              'It converges to the function value at the midpoint',
              'It stays constant — the gap never closes',
              'It converges to zero, confirming that the integral is the common limit',
              'It diverges if the function is not monotone',
            ]}
            correct={2}
            explanation="For a continuous function on [a, b], the function is uniformly continuous, so its oscillation on each subinterval → 0 as the mesh width → 0. This forces U_N − L_N → 0, confirming that both sums converge to the same limit — the definite integral."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot moves with velocity v(t) = t m/s for t ∈ [0, 3]. Without using antiderivatives, use a 3-subinterval right-endpoint sum to estimate ∫₀³ t dt and determine whether it over- or underestimates."
            options={[
              'Sum = 4.5 (exact); right endpoint neither over- nor underestimates for a linear function',
              'Sum = 6, which overestimates the true value of 4.5 because v(t) = t is increasing',
              'Sum = 3, which underestimates because the left endpoint is used',
              'Sum = 4.5, which underestimates because t is increasing',
            ]}
            correct={1}
            explanation="Partition [0,3] into N=3 intervals of width Δt=1. Right endpoints: t=1,2,3. Sum = v(1)·1 + v(2)·1 + v(3)·1 = 1 + 2 + 3 = 6. True integral = 3²/2 = 4.5. Since v(t)=t is increasing, the right endpoint is the maximum on each subinterval, so the right-endpoint sum equals the upper Darboux sum and overestimates."
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
              Write the definition of the lower and upper Darboux sums and state the condition for
              Riemann integrability. Sketch a step-function approximation to <InlineMath>{'x^2'}</InlineMath>
              on <InlineMath>{'[0,2]'}</InlineMath> with 4 subintervals.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              State the four key properties of the definite integral (linearity, interval additivity,
              sign, reversal). Give a 1-sentence robotics motivation for the interval additivity property.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Re-derive <InlineMath>{'\\int_0^2 x^2\\,dx = 8/3'}</InlineMath> using right-endpoint sums
              and the formula <InlineMath>{'\\sum_{i=1}^N i^2 = N(N+1)(2N+1)/6'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              For <InlineMath>{'f(x) = \\sin x'}</InlineMath> on <InlineMath>{'[0,\\pi]'}</InlineMath>,
              state whether the right-endpoint Riemann sum overestimates or underestimates for
              <InlineMath>{'\\;x \\in [0, \\pi/2]'}</InlineMath> vs. <InlineMath>{'[\\pi/2, \\pi]'}</InlineMath>.
              Use the widget to verify.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Explain in under 90 seconds what a Riemann sum is, why the integral is their limit, and
              connect this to the confidence-bound philosophy from Lecture 25.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
