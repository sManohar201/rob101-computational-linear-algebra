import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  Factorial helper
// ════════════════════════════════════════════════════════════════════════════
function factorial(n) {
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r
}

// ════════════════════════════════════════════════════════════════════════════
//  PRESETS — function, its nth derivative at center, and Taylor terms
// ════════════════════════════════════════════════════════════════════════════
const PRESETS = [
  {
    label: 'sin x',
    fn: x => Math.sin(x),
    // derivatives at a: sin(a), cos(a), -sin(a), -cos(a), sin(a), ...
    taylor: (x, a, N) => {
      let s = 0
      const derivs = [Math.sin(a), Math.cos(a), -Math.sin(a), -Math.cos(a)]
      for (let k = 0; k <= N; k++) {
        s += (derivs[k % 4] / factorial(k)) * Math.pow(x - a, k)
      }
      return s
    },
    domain: [-2 * Math.PI, 2 * Math.PI],
  },
  {
    label: 'eˣ',
    fn: x => Math.exp(x),
    // All derivatives at a are e^a
    taylor: (x, a, N) => {
      let s = 0
      const ea = Math.exp(a)
      for (let k = 0; k <= N; k++) s += (ea / factorial(k)) * Math.pow(x - a, k)
      return s
    },
    domain: [-3, 3],
  },
  {
    label: 'ln(1+x)',
    fn: x => Math.log(1 + x),
    taylor: (x, a, N) => {
      let s = Math.log(1 + a)
      for (let k = 1; k <= N; k++) {
        const dk = Math.pow(-1, k - 1) * factorial(k - 1) / Math.pow(1 + a, k)
        s += (dk / factorial(k)) * Math.pow(x - a, k)
      }
      return s
    },
    domain: [-0.9, 3],
  },
]

// ════════════════════════════════════════════════════════════════════════════
//  WIDGET
// ════════════════════════════════════════════════════════════════════════════
function TaylorWidget() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [center, setCenter] = useState(0)
  const [degree, setDegree] = useState(2)

  const { fn, taylor, domain } = PRESETS[presetIdx]
  const [xMin, xMax] = domain
  const a = Math.max(xMin + 0.1, Math.min(xMax - 0.1, center))

  const W = 320, H = 200
  const margin = { left: 24, right: 8, top: 12, bottom: 18 }
  const iW = W - margin.left - margin.right
  const iH = H - margin.top - margin.bottom

  const N_pts = 200
  const xs = Array.from({ length: N_pts }, (_, i) => xMin + (i / (N_pts - 1)) * (xMax - xMin))
  const ys = xs.map(fn)
  const tyApprox = xs.map(x => taylor(x, a, degree))
  const allY = [...ys, ...tyApprox.filter(isFinite)]
  const yMin = Math.max(Math.min(...allY) - 0.5, -10)
  const yMax = Math.min(Math.max(...allY) + 0.5, 10)

  const px = x => margin.left + ((x - xMin) / (xMax - xMin)) * iW
  const py = y => margin.top + iH - ((Math.max(yMin, Math.min(yMax, y)) - yMin) / (yMax - yMin)) * iH

  const fnPts = xs.map(x => `${px(x).toFixed(1)},${py(fn(x)).toFixed(1)}`).join(' ')
  const tPts = xs
    .filter((_, i) => isFinite(tyApprox[i]) && tyApprox[i] >= yMin - 0.1 && tyApprox[i] <= yMax + 0.1)
    .map(x => `${px(x).toFixed(1)},${py(taylor(x, a, degree)).toFixed(1)}`)
    .join(' ')

  const py0 = py(0)
  const fa = fn(a)
  const ta = taylor(a, a, degree)
  const errHere = Math.abs(fn(a + 0.5) - taylor(a + 0.5, a, degree))

  return (
    <div className="widget">
      <p className="widget-caption">
        The blue curve is <InlineMath>{'f(x)'}</InlineMath>. The orange dashed curve is the degree-
        <InlineMath>{'N'}</InlineMath> Taylor polynomial centered at <InlineMath>{'a'}</InlineMath>
        (green line). Increase <InlineMath>{'N'}</InlineMath> to see the approximation improve near
        <InlineMath>{'\\;a'}</InlineMath> and observe where it breaks down.
      </p>
      <div className="widget-card">
        <svg width={W} height={H} style={{ background: '#f4f8fd', borderRadius: '8px', display: 'block' }}>
          {py0 >= margin.top && py0 <= H - margin.bottom &&
            <line x1={margin.left} y1={py0} x2={W - margin.right} y2={py0} stroke="#8899bb" strokeWidth="0.8" />}
          <polyline points={fnPts} fill="none" stroke="#1c7ed6" strokeWidth="2" strokeLinejoin="round" />
          {tPts && <polyline points={tPts} fill="none" stroke="#e8590c" strokeWidth="2" strokeDasharray="6 3" strokeLinejoin="round" />}
          <line x1={px(a)} y1={margin.top} x2={px(a)} y2={H - margin.bottom}
            stroke="#2f9e44" strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx={px(a)} cy={py(fa)} r="4" fill="#2f9e44" />
          {[Math.ceil(xMin), 0, Math.floor(xMax)].filter(v => v >= xMin && v <= xMax).map(v => (
            <text key={v} x={px(v)} y={py0 + 13} fontSize="9" fill="#5c6b85" textAnchor="middle">{v}</text>
          ))}
        </svg>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label className="slider-row">
              <span className="slider-label">Center <em>a</em> = <b>{a.toFixed(2)}</b></span>
              <input type="range" min={xMin + 0.1} max={xMax - 0.1} step={(xMax - xMin) / 200}
                value={a} onChange={e => setCenter(Number(e.target.value))} />
            </label>
            <label className="slider-row">
              <span className="slider-label">Degree <em>N</em> = <b>{degree}</b></span>
              <input type="range" min={1} max={9} step={1}
                value={degree} onChange={e => setDegree(Number(e.target.value))} />
            </label>
          </div>
          <div className="hud-panel" style={{ minWidth: '140px' }}>
            <div className="hud-row"><span>f(a)</span><strong>{fa.toFixed(4)}</strong></div>
            <div className="hud-row"><span>T_N(a)</span><strong>{ta.toFixed(4)}</strong></div>
            <div className="hud-row"><span>|err at a+0.5|</span><strong>{errHere.toFixed(5)}</strong></div>
          </div>
        </div>
        <div className="preset-bar" style={{ marginTop: '8px' }}>
          {PRESETS.map((p, i) => (
            <button key={i}
              className={`preset-btn ${presetIdx === i ? 'active' : ''}`}
              onClick={() => { setPresetIdx(i); setCenter(0); setDegree(2) }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L34() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#ebf5fb', color: '#1a6a9a', borderColor: '#aed6f1' }}>
          Module 7 · Lecture 34 · ROB 201
        </div>
        <h1 className="lesson-title">Single-Variable Differentiation &amp; Taylor Series</h1>
        <p className="lesson-subtitle">
          Differentiation quantifies rate of change; Taylor series packages all that rate-of-change
          information into a polynomial proxy. Together they let engineers linearize nonlinear systems,
          estimate errors, and prove that L'Hôpital's rule works.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            The derivative <InlineMath>{'f^{\\prime}(a)'}</InlineMath> is the slope of the tangent line
            at <InlineMath>{'x = a'}</InlineMath> — a local linear approximation
            <InlineMath>{'\\;f(x) \\approx f(a) + f^{\\prime}(a)(x-a)'}</InlineMath>. But why stop
            at linear? The second derivative measures the <em>bending</em> of the curve; include it and
            the approximation improves. Keep going and you get the Taylor series:
          </p>
          <DisplayMath>{String.raw`f(x) = \sum_{k=0}^{\infty} \frac{f^{(k)}(a)}{k!}(x-a)^k.`}</DisplayMath>
          <p>
            This is the key insight: a smooth function is <em>completely determined locally</em> by
            all its derivatives at a single point. Every sine wave, exponential, and logarithm can be
            built out of polynomials — provided you use enough terms and stay close to the expansion
            center. The radius of convergence tells you how "close" is close enough.
          </p>
          <p>
            In robotics, Taylor series underpins small-angle approximations (sin θ ≈ θ), linearization
            of nonlinear dynamics around an operating point, and the numerical stability analysis of
            ODE solvers. In machine learning, Taylor-expanded loss landscapes guide second-order
            optimization methods (Newton, natural gradient).
          </p>
        </div>
      </section>

      {/* ── Formalism: differentiation rules ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · DIFFERENTIATION RULES</span>
        </h2>
        <div className="content-block">
          <p>
            The derivative is the limit of the difference quotient:
          </p>
          <DisplayMath>{String.raw`f'(a) = \lim_{h\to 0}\frac{f(a+h)-f(a)}{h}.`}</DisplayMath>
          <p>The four structural rules:</p>
          <div className="callout callout-info">
            <strong>Power rule.</strong>{' '}
            <InlineMath>{'\\dfrac{d}{dx}[x^n] = nx^{n-1}'}</InlineMath> — every term in a polynomial
            differentiates independently.
          </div>
          <div className="callout callout-info">
            <strong>Product rule.</strong>{' '}
            <InlineMath>{'(fg)^{\\prime} = f^{\\prime}g + fg^{\\prime}'}</InlineMath> — each factor
            differentiates once while the other is held constant.
          </div>
          <div className="callout callout-info">
            <strong>Chain rule.</strong>{' '}
            <InlineMath>{'\\dfrac{d}{dx}[f(g(x))] = f^{\\prime}(g(x))\\cdot g^{\\prime}(x)'}</InlineMath> —
            outer function evaluated at inner, times derivative of inner.
          </div>
          <div className="callout callout-info">
            <strong>Quotient rule.</strong>{' '}
            <InlineMath>{'\\left(\\dfrac{f}{g}\\right)^{\\prime} = \\dfrac{f^{\\prime}g - fg^{\\prime}}{g^2}'}</InlineMath>.
          </div>
          <p>
            <strong>L'Hôpital's rule.</strong> If <InlineMath>{'\\lim_{x\\to c}f(x)=0'}</InlineMath> and
            <InlineMath>{'\\;\\lim_{x\\to c}g(x)=0'}</InlineMath> (or both <InlineMath>{'\\pm\\infty'}</InlineMath>),
            then
          </p>
          <DisplayMath>{String.raw`\lim_{x\to c}\frac{f(x)}{g(x)} = \lim_{x\to c}\frac{f'(x)}{g'(x)},`}</DisplayMath>
          <p>
            provided the right-hand limit exists. This resolves indeterminate forms
            <InlineMath>{'\\;0/0'}</InlineMath> and <InlineMath>{'\\;\\infty/\\infty'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Formalism: Taylor series ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · TAYLOR SERIES &amp; REMAINDER</span>
        </h2>
        <div className="content-block">
          <p>
            The <em>degree-N Taylor polynomial</em> at <InlineMath>{'x = a'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`T_N(x) = \sum_{k=0}^{N} \frac{f^{(k)}(a)}{k!}(x-a)^k.`}</DisplayMath>
          <p>
            The <strong>Lagrange remainder</strong> bounds the error:
          </p>
          <DisplayMath>{String.raw`|f(x) - T_N(x)| \leq \frac{M_{N+1}}{(N+1)!}\,|x-a|^{N+1},`}</DisplayMath>
          <p>
            where <InlineMath>{'M_{N+1} = \\max|f^{(N+1)}|'}</InlineMath> on the interval between
            <InlineMath>{'\\;a'}</InlineMath> and <InlineMath>{'\\;x'}</InlineMath>. The three canonical
            Maclaurin series (<InlineMath>{'a=0'}</InlineMath>):
          </p>
          <DisplayMath>{String.raw`e^x = \sum_{k=0}^\infty \frac{x^k}{k!},\quad
\sin x = \sum_{k=0}^\infty \frac{(-1)^k x^{2k+1}}{(2k+1)!},\quad
\cos x = \sum_{k=0}^\infty \frac{(-1)^k x^{2k}}{(2k)!}.`}</DisplayMath>
          <div className="callout callout-success">
            <strong>Small-angle approximation.</strong> Taking only the first non-trivial term:
            <InlineMath>{'\\sin\\theta \\approx \\theta'}</InlineMath> for small
            <InlineMath>{'\\;\\theta'}</InlineMath> (radians). Error is
            <InlineMath>{'\\;O(\\theta^3)'}</InlineMath> — for <InlineMath>{'\\theta = 0.1'}</InlineMath>
            rad the error is <InlineMath>{'0.1^3/6 \\approx 0.017\\%'}</InlineMath>. This linearization
            converts the nonlinear pendulum ODE into a tractable linear system.
          </div>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · TAYLOR POLYNOMIAL EXPLORER</span>
        </h2>
        <TaylorWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · LINEARIZING ROBOT DYNAMICS</span>
        </h2>
        <div className="content-block">
          <p>
            A simple pendulum satisfies <InlineMath>{'\\ddot{\\theta} = -(g/l)\\sin\\theta'}</InlineMath>.
            Linearize around <InlineMath>{'\\theta^* = 0'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\sin\theta \approx \theta \implies \ddot{\theta} \approx -\frac{g}{l}\,\theta.`}</DisplayMath>
          <p>
            This linear ODE has solution
            <InlineMath>{'\\theta(t) = A\\cos(\\omega_0 t) + B\\sin(\\omega_0 t)'}</InlineMath>,
            <InlineMath>{'\\;\\omega_0 = \\sqrt{g/l}'}</InlineMath>. The Lagrange remainder confirms
            the approximation error is at most <InlineMath>{'|\\theta|^3/6'}</InlineMath> — under 1%
            for <InlineMath>{'\\theta < 0.3'}</InlineMath> rad.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 35 asks: what if we cannot write down <InlineMath>{'f'}</InlineMath> symbolically?
            Automatic differentiation computes <InlineMath>{'f^{\\prime}(x)'}</InlineMath> to machine
            precision without an explicit derivative formula — the backbone of modern deep learning.
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
              <h3>Joint Linearization</h3>
              <p>
                Every joint in a robotic arm has nonlinear dynamics. Taylor expansion around the
                operating point yields the Jacobian linearization: a linear state-space model valid
                near that point, enabling LQR and PID design.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📡</div>
              <h3>GPS Error Budgeting</h3>
              <p>
                Ionospheric delay corrections use Taylor expansions of signal propagation models in
                atmospheric density. The Lagrange remainder bounds the correction error as a function
                of satellite elevation angle.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Newton's Method in Optimization</h3>
              <p>
                Newton steps <InlineMath>{'\\Delta w = -H^{-1}g'}</InlineMath> use the second-order
                Taylor approximation of the loss. This is why the Hessian
                <InlineMath>{'\\;H'}</InlineMath> appears in curvature-aware optimizers.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔬</div>
              <h3>EKF Jacobians</h3>
              <p>
                The Extended Kalman Filter linearizes a nonlinear observation model
                <InlineMath>{'\\;h(x)'}</InlineMath> via
                <InlineMath>{'\\;h(x) \\approx h(\\hat x) + H(x-\\hat x)'}</InlineMath>, where
                <InlineMath>{'\\;H = \\partial h/\\partial x|_{\\hat x}'}</InlineMath> is the Jacobian
                at the current estimate.
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
            num={1} type="Computation"
            question="Compute d/dx[x²·sin(x)] using the product rule."
            options={[
              '2x·sin(x) + x²·cos(x)',
              '2x·cos(x)',
              'x²·cos(x)',
              '2x·sin(x)·cos(x)',
            ]}
            correct={0}
            explanation="Product rule: d/dx[x²·sin(x)] = (d/dx[x²])·sin(x) + x²·(d/dx[sin(x)]) = 2x·sin(x) + x²·cos(x)."
          />
          <QuizQ
            num={2} type="Concept"
            question="The Taylor series for sin(x) at a=0 starts x − x³/3! + …. The small-angle approximation sin(θ) ≈ θ keeps which terms?"
            options={[
              'All terms up to degree 5',
              'Only the k=0 constant term',
              'Only the k=1 linear term (x)',
              'The first two terms: x − x³/6',
            ]}
            correct={2}
            explanation="The small-angle approximation truncates at the first-order term: sin(θ) ≈ θ. Higher terms (x³, x⁵, …) are dropped. The error is O(θ³): for θ = 0.1 rad the error is about 0.1³/6 ≈ 0.017%."
          />
          <QuizQ
            num={3} type="Application"
            question="L'Hôpital's rule evaluates lim(x→0) [sin(x)/x]. What is the limit?"
            options={[
              '0',
              'Undefined',
              '∞',
              '1',
            ]}
            correct={3}
            explanation="Direct substitution gives 0/0 (indeterminate). Apply L'Hôpital: differentiate numerator and denominator → lim(x→0)[cos(x)/1] = cos(0) = 1. This confirms the well-known limit sin(x)/x → 1."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A nonlinear joint has torque τ = k·θ³. The linearization around θ* = 0 gives τ ≈ ?"
            options={[
              '3k·θ',
              '0 (the first-order Taylor term is zero)',
              'k·θ²',
              'k·θ',
            ]}
            correct={1}
            explanation="The first-order Taylor term is τ'(0)·θ = 3k·0²·θ = 0. The linearization is identically zero — the joint has zero effective stiffness at the origin. The dominant behavior near θ* = 0 is the cubic term kθ³, which is not captured by linearization."
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
              Write the product rule and chain rule. Compute
              <InlineMath>{'\\frac{d}{dx}[\\sin(x^2)]'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Write the Taylor series formula. Compute <InlineMath>{'T_3(x)'}</InlineMath> for
              <InlineMath>{'\\;e^x'}</InlineMath> at <InlineMath>{'a = 0'}</InlineMath>.
              Estimate <InlineMath>{'e^{0.1}'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Evaluate <InlineMath>{'\\lim_{x\\to 0}(1-\\cos x)/x^2'}</InlineMath> using L'Hôpital
              twice. Verify using the Taylor expansion of cos.
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Linearize <InlineMath>{'f(\\theta) = \\sin(\\theta) + 0.1\\theta^3'}</InlineMath>
              around <InlineMath>{'\\theta^* = 0'}</InlineMath>. Estimate the error at
              <InlineMath>{'\\theta = 0.5'}</InlineMath> rad.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state the Lagrange remainder bound. Explain why
              <InlineMath>{'\\sin\\theta \\approx \\theta'}</InlineMath> holds to 1% accuracy for
              <InlineMath>{'\\theta < 0.24'}</InlineMath> rad.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
