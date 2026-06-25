import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  MATRIX EXPONENTIAL / EIGENVALUE STABILITY WIDGET
//  For a 2×2 system ẋ = Ax, shows eigenvalue positions in the complex plane
//  and the resulting trajectory in phase space.
// ════════════════════════════════════════════════════════════════════════════

const PRESETS = [
  {
    label: 'Stable spiral',
    // A = [[-1, -2], [2, -1]]  eigenvalues −1 ± 2i
    A: [[-1, -2], [2, -1]],
    lambda: [{ re: -1, im: 2 }, { re: -1, im: -2 }],
    x0: [1.5, 0],
    desc: 'λ = −1 ± 2i  →  stable spiral in',
  },
  {
    label: 'Unstable spiral',
    A: [[0.3, -2], [2, 0.3]],
    lambda: [{ re: 0.3, im: 2 }, { re: 0.3, im: -2 }],
    x0: [0.3, 0],
    desc: 'λ = 0.3 ± 2i  →  unstable spiral out',
  },
  {
    label: 'Real stable nodes',
    A: [[-2, 0], [0, -0.5]],
    lambda: [{ re: -2, im: 0 }, { re: -0.5, im: 0 }],
    x0: [1.2, 1.0],
    desc: 'λ = −2, −0.5  →  stable node',
  },
]

// Simulate ẋ = Ax via matrix-vector multiply + Euler
function simulate(A, x0, h, n) {
  const pts = [{ x: x0[0], y: x0[1] }]
  let x = x0[0], y = x0[1]
  for (let i = 0; i < n; i++) {
    const dx = A[0][0]*x + A[0][1]*y
    const dy = A[1][0]*x + A[1][1]*y
    // RK4
    const [k1x, k1y] = [dx, dy]
    const [k2x, k2y] = [A[0][0]*(x+h/2*k1x)+A[0][1]*(y+h/2*k1y),
                        A[1][0]*(x+h/2*k1x)+A[1][1]*(y+h/2*k1y)]
    const [k3x, k3y] = [A[0][0]*(x+h/2*k2x)+A[0][1]*(y+h/2*k2y),
                        A[1][0]*(x+h/2*k2x)+A[1][1]*(y+h/2*k2y)]
    const [k4x, k4y] = [A[0][0]*(x+h*k3x)+A[0][1]*(y+h*k3y),
                        A[1][0]*(x+h*k3x)+A[1][1]*(y+h*k3y)]
    x += h/6*(k1x+2*k2x+2*k3x+k4x)
    y += h/6*(k1y+2*k2y+2*k3y+k4y)
    pts.push({ x, y })
    if (Math.sqrt(x*x+y*y) > 8) break
  }
  return pts
}

function StabilityWidget() {
  const [presetIdx, setPresetIdx] = useState(0)

  const { A, lambda, x0, desc } = PRESETS[presetIdx]
  const W = 280, H = 260
  const pW = 180, pH = 180

  // Phase portrait
  const domain = 2.5
  const pxF = v => pW/2 + (v / domain) * (pW/2 - 8)
  const pyF = v => pH/2 - (v / domain) * (pH/2 - 8)

  const pts = useMemo(() =>
    simulate(A, x0, 0.02, 600)
  , [presetIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const polyline = pts.map(p => `${pxF(p.x).toFixed(1)},${pyF(p.y).toFixed(1)}`).join(' ')

  // Eigenvalue s-plane
  const spW = 90, spH = 180
  const reRange = 1.5, imRange = 3
  const spx = re => spW/2 + (re / reRange) * (spW/2 - 8)
  const spy = im => spH/2 - (im / imRange) * (spH/2 - 8)

  return (
    <div className="widget">
      <p className="widget-caption">
        Left: phase portrait of <InlineMath>{'\\dot{\\mathbf{x}} = A\\mathbf{x}'}</InlineMath>.
        Right: eigenvalues of <InlineMath>{'A'}</InlineMath> in the complex plane. Eigenvalues in
        the <em>left half-plane</em> (Re&nbsp;&lt;&nbsp;0) produce decaying trajectories; right
        half-plane produces growth.
      </p>
      <div className="widget-card">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Phase portrait */}
          <div>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginBottom: '4px' }}>Phase portrait</div>
            <svg width={pW} height={pH}
              style={{ background: '#f4f8fd', borderRadius: '8px' }}>
              <line x1={8} y1={pH/2} x2={pW-4} y2={pH/2} stroke="#8899bb" strokeWidth="0.7" />
              <line x1={pW/2} y1={4} x2={pW/2} y2={pH-4} stroke="#8899bb" strokeWidth="0.7" />
              <polyline points={polyline} fill="none" stroke="#7950f2" strokeWidth="1.8"
                strokeLinejoin="round" />
              <circle cx={pxF(x0[0]).toFixed(1)} cy={pyF(x0[1]).toFixed(1)}
                r="4" fill="#c92a2a" />
            </svg>
          </div>

          {/* s-plane */}
          <div>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginBottom: '4px' }}>s-plane eigenvalues</div>
            <svg width={spW} height={spH}
              style={{ background: '#f4f8fd', borderRadius: '8px' }}>
              {/* Shading: left half stable */}
              <rect x={0} y={0} width={spx(0)} height={spH} fill="rgba(47,158,68,0.08)" />
              <rect x={spx(0)} y={0} width={spW - spx(0)} height={spH} fill="rgba(201,42,42,0.06)" />
              <line x1={spx(0)} y1={4} x2={spx(0)} y2={spH-4} stroke="#8899bb" strokeWidth="1" />
              <line x1={4} y1={spH/2} x2={spW-4} y2={spH/2} stroke="#8899bb" strokeWidth="0.7" />
              <text x={4} y={12} fontSize="8" fill="#2f9e44" opacity="0.6">stable</text>
              <text x={spx(0)+3} y={12} fontSize="8" fill="#c92a2a" opacity="0.6">unstable</text>
              {lambda.map((lm, i) => (
                <circle key={i} cx={spx(lm.re).toFixed(1)} cy={spy(lm.im).toFixed(1)}
                  r="5" fill={lm.re < 0 ? '#2f9e44' : '#c92a2a'}
                  stroke="white" strokeWidth="1.5" />
              ))}
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: '120px' }}>
            <div className="hud-panel">
              {lambda.map((lm, i) => (
                <div key={i} className="hud-row">
                  <span>λ<sub>{i+1}</sub></span>
                  <strong style={{ color: lm.re < 0 ? '#2f9e44' : '#c92a2a' }}>
                    {lm.re.toFixed(1)}{lm.im !== 0 ? ` ${lm.im > 0 ? '+' : ''}${lm.im.toFixed(1)}i` : ''}
                  </strong>
                </div>
              ))}
              <div className="hud-row">
                <span>Stable?</span>
                <strong>{lambda.every(l => l.re < 0) ? '✓ Yes' : '✗ No'}</strong>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#5c6b85', marginTop: '8px' }}>{desc}</div>
          </div>
        </div>
        <div className="preset-bar" style={{ marginTop: '10px' }}>
          {PRESETS.map((p, i) => (
            <button key={i}
              className={`preset-btn ${presetIdx === i ? 'active' : ''}`}
              onClick={() => setPresetIdx(i)}>
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

export default function L37() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#f5eef8', color: '#6c3483', borderColor: '#d2b4de' }}>
          Module 8 · Lecture 37 · ROB 201
        </div>
        <h1 className="lesson-title">LTI State-Space &amp; Matrix Exponentials</h1>
        <p className="lesson-subtitle">
          Linear time-invariant (LTI) systems have a complete analytical solution via the matrix
          exponential. The eigenvalues of the system matrix determine everything: stability, oscillation
          frequency, and decay rate — without needing to integrate numerically.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            For the scalar ODE <InlineMath>{'\\dot{x} = ax'}</InlineMath> the solution is obvious:
            <InlineMath>{'\\;x(t) = e^{at}x_0'}</InlineMath>. Positive <InlineMath>{'a'}</InlineMath>
            means growth; negative means decay. For a vector system
            <InlineMath>{'\\;\\dot{\\mathbf{x}} = A\\mathbf{x}'}</InlineMath> the answer is the
            same idea extended to matrices:
            <InlineMath>{'\\;\\mathbf{x}(t) = e^{At}\\mathbf{x}_0'}</InlineMath>.
          </p>
          <p>
            The matrix exponential is defined through its Taylor series:
            <InlineMath>{'\\;e^{At} = I + At + (At)^2/2! + \\cdots'}</InlineMath>. But computing
            it that way is slow. The efficient route is diagonalization: if
            <InlineMath>{'\\;A = V\\Lambda V^{-1}'}</InlineMath> (where <InlineMath>{'\\Lambda'}</InlineMath>
            is the diagonal eigenvalue matrix), then
            <InlineMath>{'\\;e^{At} = Ve^{\\Lambda t}V^{-1}'}</InlineMath>, and
            <InlineMath>{'\\;e^{\\Lambda t}'}</InlineMath> is just a diagonal matrix of scalar
            exponentials. The eigenvalues of <InlineMath>{'A'}</InlineMath> govern everything.
          </p>
          <div className="callout callout-success">
            <strong>Stability in one sentence.</strong> An LTI system is asymptotically stable if and
            only if all eigenvalues of <InlineMath>{'A'}</InlineMath> have strictly negative real
            parts. Complex eigenvalues with negative real part produce decaying oscillations
            (stable spirals). Pure imaginary eigenvalues produce undamped oscillations.
          </div>
        </div>
      </section>

      {/* ── Formalism ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · LTI SOLUTION &amp; STABILITY</span>
        </h2>
        <div className="content-block">
          <p>
            <strong>Homogeneous LTI system:</strong>
          </p>
          <DisplayMath>{String.raw`\dot{\mathbf{x}}(t) = A\mathbf{x}(t),\quad \mathbf{x}(0) = \mathbf{x}_0
\implies \mathbf{x}(t) = e^{At}\mathbf{x}_0.`}</DisplayMath>
          <p>
            <strong>Matrix exponential via eigendecomposition.</strong> If
            <InlineMath>{'A = V\\Lambda V^{-1}'}</InlineMath> with eigenvalues
            <InlineMath>{'\\lambda_1,\\ldots,\\lambda_n'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`e^{At} = V\,\mathrm{diag}(e^{\lambda_1 t},\ldots,e^{\lambda_n t})\,V^{-1}.`}</DisplayMath>
          <p>
            <strong>Driven system (inputs):</strong>
          </p>
          <DisplayMath>{String.raw`\dot{\mathbf{x}} = A\mathbf{x} + B\mathbf{u}(t)
\implies \mathbf{x}(t) = e^{At}\mathbf{x}_0 + \int_0^t e^{A(t-\tau)}B\mathbf{u}(\tau)\,d\tau.`}</DisplayMath>
          <p>
            The integral term is the <em>convolution</em> of the impulse response with the input —
            exactly what the Laplace transform computes in the frequency domain.
          </p>
          <p>
            <strong>Stability criterion (Lyapunov).</strong> The origin is asymptotically stable
            <InlineMath>{'\\iff'}</InlineMath> all eigenvalues of <InlineMath>{'A'}</InlineMath>
            satisfy <InlineMath>{'\\text{Re}(\\lambda_i) < 0'}</InlineMath>.
          </p>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · EIGENVALUE STABILITY EXPLORER</span>
        </h2>
        <StabilityWidget />
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · DC MOTOR EIGENVALUES</span>
        </h2>
        <div className="content-block">
          <p>
            A DC motor with back-EMF: state
            <InlineMath>{'\\;\\mathbf{x} = [\\omega,\\;i]^T'}</InlineMath> (speed and current).
            State matrix:
          </p>
          <DisplayMath>{String.raw`A = \begin{bmatrix} -b/J & K_t/J \\ -K_e/L & -R/L \end{bmatrix}.`}</DisplayMath>
          <p>
            With <InlineMath>{'J=0.01, b=0.1, K_t=0.01, K_e=0.01, R=1, L=0.5'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`A = \begin{bmatrix} -10 & 1 \\ -0.02 & -2 \end{bmatrix},\quad
\lambda_{1,2} \approx -10.0,\; -2.0.`}</DisplayMath>
          <p>
            Both eigenvalues are real and negative — the motor is overdamped (no oscillation) and
            reaches steady state with time constants <InlineMath>{'\\;\\tau_1 = 0.1'}</InlineMath>
            s and <InlineMath>{'\\;\\tau_2 = 0.5'}</InlineMath> s. The faster mode
            (<InlineMath>{'\\lambda = -10'}</InlineMath>) damps out in about 0.3 s; the slower
            (<InlineMath>{'\\lambda = -2'}</InlineMath>) in about 1.5 s.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Lecture 38 converts the time-domain state-space picture to the frequency domain via the
            Laplace transform. The eigenvalues of <InlineMath>{'A'}</InlineMath> become the
            <em>poles</em> of the transfer function — and pole placement becomes the central tool for
            feedback design.
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
              <div className="app-icon">⚙️</div>
              <h3>LQR Optimal Control</h3>
              <p>
                Linear Quadratic Regulator minimizes
                <InlineMath>{'\\int(\\mathbf{x}^T Q\\mathbf{x} + \\mathbf{u}^T R\\mathbf{u})\\,dt'}</InlineMath>.
                The solution is a static gain <InlineMath>{'K'}</InlineMath> that moves all
                eigenvalues of <InlineMath>{'A - BK'}</InlineMath> into the left half-plane.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛰️</div>
              <h3>Orbit Propagation</h3>
              <p>
                Small satellite orbit perturbations obey linearized Clohessy-Wiltshire equations —
                an LTI system. The matrix exponential propagates the relative state forward over
                one orbit period without numerical integration.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🧠</div>
              <h3>Linear Recurrent Networks</h3>
              <p>
                Linear recurrent neural networks (LRNs / SSMs like Mamba) implement
                <InlineMath>{'h_{t+1} = Ah_t + Bx_t'}</InlineMath>. Stability of the hidden-state
                dynamics requires all eigenvalues of <InlineMath>{'A'}</InlineMath> inside the
                unit disk — the discrete-time analogue of the left half-plane criterion.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🔋</div>
              <h3>Battery State Estimation</h3>
              <p>
                Equivalent-circuit battery models have LTI state-space form. The matrix exponential
                gives the zero-input response during rest periods, while the driven solution
                predicts voltage under load — used in Kalman filter-based state-of-charge estimators.
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
            question="When is an LTI system ẋ = Ax asymptotically stable?"
            options={[
              'When all eigenvalues of A are positive',
              'When all eigenvalues of A have strictly negative real parts',
              'When A is a positive-definite matrix',
              'When the determinant of A is positive',
            ]}
            correct={1}
            explanation="Asymptotic stability requires all eigenvalues λ of A to satisfy Re(λ) < 0. Then each mode e^(λt) → 0 as t → ∞. Eigenvalues on the imaginary axis give sustained oscillations (marginally stable). Eigenvalues in the right half-plane give growing trajectories (unstable)."
          />
          <QuizQ
            num={2} type="Computation"
            question="A 2×2 system has eigenvalues −1 ± 3i. Describe the trajectory qualitatively."
            options={[
              'Exponential growth with oscillation',
              'Decaying oscillation (stable spiral): frequency 3 rad/s, time constant 1 s',
              'Pure oscillation at 3 Hz with no decay',
              'Monotone exponential decay, no oscillation',
            ]}
            correct={1}
            explanation="Complex eigenvalues λ = σ ± iω give decaying oscillations when σ < 0. The oscillation frequency is ω = 3 rad/s; the decay envelope is e^(−t) with time constant τ = 1/|σ| = 1 s. After t ≈ 5τ = 5 s, the amplitude is below 1% of its initial value."
          />
          <QuizQ
            num={3} type="Concept"
            question="How does the matrix exponential e^(At) relate to eigenvalues? If A = VΛV⁻¹, what is e^(At)?"
            options={[
              'e^(At) = V·e^(Λt)·V⁻¹, where e^(Λt) is a diagonal matrix of scalar exponentials',
              'e^(At) = e^(A)·e^(t) — separate exponentials',
              'e^(At) can only be computed by summing the Taylor series directly',
              'e^(At) is always the identity matrix at t = 0',
            ]}
            correct={0}
            explanation="Via eigendecomposition A = VΛV⁻¹: e^(At) = V·diag(e^(λ₁t), …, e^(λₙt))·V⁻¹. The columns of V are eigenvectors (modes); the diagonal of e^(Λt) scales each mode by its own exponential. At t=0: e^(A·0) = V·I·V⁻¹ = I ✓."
          />
          <QuizQ
            num={4} type="Transfer"
            question="A robot joint controller uses A = [[0, 1], [−4, −3]]. Are the eigenvalues stable?"
            options={[
              'No — det(A) = 4 > 0 implies positive eigenvalues',
              'Yes — det(A) = 4 > 0 and trace(A) = −3 < 0 implies both eigenvalues have negative real parts',
              'Cannot determine without computing eigenvalues explicitly',
              'Yes — A is lower triangular with positive entries',
            ]}
            correct={1}
            explanation="For a 2×2 matrix: det(A) = product of eigenvalues, trace(A) = sum of eigenvalues. det = (0)(−3)−(1)(−4) = 4 > 0 means the product λ₁λ₂ > 0 (same sign). trace = −3 < 0 means λ₁+λ₂ < 0 (both negative). So both eigenvalues are negative → stable. The actual eigenvalues are λ = (−3 ± √(9−16))/2 = −1.5 ± 1.32i."
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
              State the solution to <InlineMath>{'\\dot{\\mathbf{x}} = A\\mathbf{x}'}</InlineMath>.
              What condition on <InlineMath>{'A'}</InlineMath> ensures the solution decays to zero?
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Compute the eigenvalues of <InlineMath>{'A = \\begin{bmatrix}-2 & 1 \\\\ 0 & -3\\end{bmatrix}'}</InlineMath>.
              Is the system stable? What are the time constants?
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Explain how complex eigenvalues <InlineMath>{'\\sigma \\pm i\\omega'}</InlineMath>
              affect the trajectory. What is the physical meaning of
              <InlineMath>{'\\sigma'}</InlineMath> vs. <InlineMath>{'\\omega'}</InlineMath>?
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              Write <InlineMath>{'e^{At}'}</InlineMath> for a diagonal
              <InlineMath>{'A = \\mathrm{diag}(-1, -3)'}</InlineMath>. Verify
              <InlineMath>{'\\mathbf{x}(t) = e^{At}\\mathbf{x}_0'}</InlineMath> satisfies the ODE.
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state the stability condition for LTI systems. Describe what
              eigenvalues on the imaginary axis mean physically (hint: example is a frictionless
              pendulum).
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
