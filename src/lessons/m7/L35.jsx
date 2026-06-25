import { useState } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { QuizQ } from '../shared/ui.jsx'

// ════════════════════════════════════════════════════════════════════════════
//  Dual number helpers for forward-mode AD
// ════════════════════════════════════════════════════════════════════════════
const dual = (r, d) => ({ r, d })
const dAdd = (a, b) => dual(a.r + b.r, a.d + b.d)
const dMul = (a, b) => dual(a.r * b.r, a.r * b.d + a.d * b.r)
const dSin = a => dual(Math.sin(a.r), Math.cos(a.r) * a.d)
const dCos = a => dual(Math.cos(a.r), -Math.sin(a.r) * a.d)
const dExp = a => dual(Math.exp(a.r), Math.exp(a.r) * a.d)
const dSqr = a => dMul(a, a)

const PRESETS = [
  {
    label: 'sin(x²)',
    compute: xd => dSin(dSqr(xd)),
    symDeriv: x => 2 * x * Math.cos(x * x),
    steps: [
      { label: 'v₁ = x',       value: x => x,                    deriv: () => 1,                        desc: 'Seed: value = x, derivative = 1' },
      { label: 'v₂ = v₁·v₁',   value: x => x * x,               deriv: x => 2 * x,                     desc: 'Product rule: 2·v₁·v₁′ = 2x' },
      { label: 'v₃ = sin(v₂)', value: x => Math.sin(x * x),     deriv: x => Math.cos(x * x) * 2 * x,  desc: 'Chain rule: cos(v₂)·v₂′' },
    ],
  },
  {
    label: 'x·eˣ',
    compute: xd => dMul(xd, dExp(xd)),
    symDeriv: x => (1 + x) * Math.exp(x),
    steps: [
      { label: 'v₁ = x',       value: x => x,                  deriv: () => 1,                          desc: 'Seed' },
      { label: 'v₂ = eˣ',     value: x => Math.exp(x),        deriv: x => Math.exp(x),                 desc: 'Chain: eˣ·1' },
      { label: 'v₃ = v₁·v₂',  value: x => x * Math.exp(x),   deriv: x => (1 + x) * Math.exp(x),       desc: 'Product: v₁·v₂′ + v₂·v₁′' },
    ],
  },
  {
    label: 'sin·cos',
    compute: xd => dMul(dSin(xd), dCos(xd)),
    symDeriv: x => Math.cos(2 * x),
    steps: [
      { label: 'v₁ = sin(x)',  value: x => Math.sin(x),                     deriv: x => Math.cos(x),   desc: 'Chain: cos(x)·1' },
      { label: 'v₂ = cos(x)',  value: x => Math.cos(x),                     deriv: x => -Math.sin(x),  desc: 'Chain: −sin(x)·1' },
      { label: 'v₃ = v₁·v₂',  value: x => Math.sin(x) * Math.cos(x),      deriv: x => Math.cos(2*x), desc: 'Product → cos(2x)' },
    ],
  },
]

function ADWidget() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [xVal, setXVal] = useState(1.0)

  const { compute, symDeriv, steps, label } = PRESETS[presetIdx]
  const x = xVal
  const result = compute(dual(x, 1))
  const adDeriv = result.d
  const trueDeriv = symDeriv(x)
  const err = Math.abs(adDeriv - trueDeriv)

  return (
    <div className="widget">
      <p className="widget-caption">
        Each row of the trace table carries a <em>dual number</em>{' '}
        <InlineMath>{'(v,\\,v^{\\prime})'}</InlineMath>: value and derivative together. The final
        row's derivative is <InlineMath>{'f^{\\prime}(x)'}</InlineMath> — exact to machine precision.
      </p>
      <div className="widget-card">
        <div className="preset-bar" style={{ marginBottom: '12px' }}>
          {PRESETS.map((p, i) => (
            <button key={i}
              className={`preset-btn ${presetIdx === i ? 'active' : ''}`}
              onClick={() => setPresetIdx(i)}>
              {p.label}
            </button>
          ))}
        </div>

        <label className="slider-row">
          <span className="slider-label">x = <b>{x.toFixed(3)}</b></span>
          <input type="range" min={-2} max={2} step={0.01} value={x}
            onChange={e => setXVal(Number(e.target.value))} />
        </label>

        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#ebf5fb' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #aed6f1' }}>Step</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '2px solid #aed6f1' }}>Value v</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '2px solid #aed6f1' }}>Deriv v′</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #aed6f1' }}>Rule</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8fbff' : '#ffffff' }}>
                  <td style={{ padding: '5px 10px', fontFamily: 'monospace', color: '#1a6a9a' }}>{s.label}</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{s.value(x).toFixed(5)}</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#e8590c' }}>{s.deriv(x).toFixed(5)}</td>
                  <td style={{ padding: '5px 10px', color: '#5c6b85', fontSize: '11px' }}>{s.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hud-panel" style={{ marginTop: '12px' }}>
          <div className="hud-row"><span>f(x) via AD</span><strong>{result.r.toFixed(6)}</strong></div>
          <div className="hud-row"><span style={{ color: '#e8590c' }}>f′(x) via AD</span><strong style={{ color: '#e8590c' }}>{adDeriv.toFixed(6)}</strong></div>
          <div className="hud-row"><span>f′(x) symbolic</span><strong>{trueDeriv.toFixed(6)}</strong></div>
          <div className="hud-row">
            <span>Error</span>
            <strong style={{ color: err < 1e-12 ? '#2f9e44' : '#c92a2a' }}>{err.toExponential(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LESSON
// ════════════════════════════════════════════════════════════════════════════

export default function L35() {
  return (
    <div className="lesson">

      <div className="lesson-header">
        <div className="module-tag"
          style={{ background: '#ebf5fb', color: '#1a6a9a', borderColor: '#aed6f1' }}>
          Module 7 · Lecture 35 · ROB 201
        </div>
        <h1 className="lesson-title">Software Differentiation &amp; Automatic Differentiation</h1>
        <p className="lesson-subtitle">
          When the function is a program rather than a formula, automatic differentiation (AD) computes
          exact derivatives by propagating dual numbers through the computation graph. This is the
          engine inside PyTorch, JAX, and TensorFlow.
        </p>
      </div>

      {/* ── Intuition ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag intuition-tag">INTUITION</span></h2>
        <div className="content-block">
          <p>
            Three ways to differentiate code:
          </p>
          <div className="callout callout-info">
            <strong>Finite differences.</strong>{' '}
            <InlineMath>{'f^{\\prime}(x) \\approx [f(x+h)-f(x)]/h'}</InlineMath>. Simple but
            numerically unreliable: too-large <InlineMath>{'h'}</InlineMath> causes truncation error;
            too-small <InlineMath>{'h'}</InlineMath> causes cancellation. Costs one function evaluation
            per input dimension.
          </div>
          <div className="callout callout-info">
            <strong>Symbolic differentiation.</strong> Apply derivative rules algebraically (as a CAS
            does). Exact, but produces expression swell — the symbolic form of the derivative grows
            far larger than the original function.
          </div>
          <div className="callout callout-success">
            <strong>Automatic differentiation.</strong> Tag every number with its current derivative,
            then propagate both through every arithmetic operation via the chain rule. Exact to machine
            precision, no expression swell, works on arbitrary programs — including loops and
            conditionals. Modern deep learning is built on this.
          </div>
        </div>
      </section>

      {/* ── Formalism: dual numbers ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · DUAL NUMBERS &amp; FORWARD MODE</span>
        </h2>
        <div className="content-block">
          <p>
            A <em>dual number</em> is a pair <InlineMath>{'(v,\\, v^{\\prime})'}</InlineMath> where
            <InlineMath>{'\\;v'}</InlineMath> is the primal value and
            <InlineMath>{'\\;v^{\\prime}'}</InlineMath> is the tangent (derivative). Arithmetic obeys:
          </p>
          <DisplayMath>{String.raw`(a,\,a') + (b,\,b') = (a+b,\; a'+b')`}</DisplayMath>
          <DisplayMath>{String.raw`(a,\,a') \times (b,\,b') = \bigl(ab,\; ab'+a'b\bigr) \quad\text{[product rule]}`}</DisplayMath>
          <DisplayMath>{String.raw`\sin(a,\,a') = \bigl(\sin a,\; \cos(a)\cdot a'\bigr) \quad\text{[chain rule]}`}</DisplayMath>
          <p>
            To differentiate <InlineMath>{'f'}</InlineMath> at <InlineMath>{'x_0'}</InlineMath>,
            seed the input as the dual number <InlineMath>{'(x_0,\\ 1)'}</InlineMath>. Run the program.
            The output tangent is <InlineMath>{'f^{\\prime}(x_0)'}</InlineMath>.
          </p>
          <pre className="code-block"><code>{`# Forward AD: f(x) = sin(x²)
x  = Dual(x0, 1.0)       # seed
v1 = x * x               # Dual(x0², 2·x0)
v2 = sin(v1)             # Dual(sin(x0²), cos(x0²)·2·x0)
# output.deriv = 2·x0·cos(x0²)  ← exact`}</code></pre>
        </div>
      </section>

      {/* ── Interactive ── */}
      <section className="lesson-section widget-section">
        <h2 className="section-title">
          <span className="section-tag widget-tag">INTERACTIVE · FORWARD-MODE AD TRACE</span>
        </h2>
        <ADWidget />
      </section>

      {/* ── Formalism: reverse mode ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag formalism-tag">FORMALISM · REVERSE-MODE AD (BACKPROPAGATION)</span>
        </h2>
        <div className="content-block">
          <p>
            For a scalar loss <InlineMath>{'L(w_1,\\ldots,w_n)'}</InlineMath>, forward mode requires
            <InlineMath>{'\\;n'}</InlineMath> passes (one per parameter). Reverse mode needs only one:
          </p>
          <p>
            <strong>Forward pass:</strong> evaluate <InlineMath>{'L'}</InlineMath> and record the
            computation graph. Each node stores its inputs and the operation that produced it.
          </p>
          <p>
            <strong>Backward pass:</strong> initialize <InlineMath>{'\\bar{L} = 1'}</InlineMath>.
            Propagate <em>adjoint values</em>
            <InlineMath>{'\\;\\bar{v} = \\partial L/\\partial v'}</InlineMath> backwards through the
            graph. For a product node <InlineMath>{'z = a \\cdot b'}</InlineMath>:
          </p>
          <DisplayMath>{String.raw`\bar{a} \mathrel{+}= \bar{z}\cdot b,\qquad \bar{b} \mathrel{+}= \bar{z}\cdot a.`}</DisplayMath>
          <p>
            After one backward sweep, each <InlineMath>{'w_i'}</InlineMath> has accumulated
            <InlineMath>{'\\;\\partial L/\\partial w_i'}</InlineMath>. This is exactly backpropagation.
          </p>
          <div className="callout callout-success">
            <strong>AD vs. finite differences.</strong> Finite differences have error
            <InlineMath>{'\\;O(h)'}</InlineMath> plus floating-point cancellation; AD has error
            at the level of floating-point rounding in the primal computation — roughly
            <InlineMath>{'\\;10^{-15}'}</InlineMath> for double precision. No step size to tune.
          </div>
        </div>
      </section>

      {/* ── Worked example ── */}
      <section className="lesson-section">
        <h2 className="section-title">
          <span className="section-tag example-tag">WORKED EXAMPLE · GRADIENT OF A NEURAL NETWORK LOSS</span>
        </h2>
        <div className="content-block">
          <p>
            Consider a one-layer network: <InlineMath>{'L(w) = \\tfrac{1}{2}(\\sigma(wx) - y)^2'}</InlineMath>
            where <InlineMath>{'\\sigma(z) = 1/(1+e^{-z})'}</InlineMath>. By hand:
          </p>
          <DisplayMath>{String.raw`\frac{\partial L}{\partial w} = (\sigma(wx)-y)\cdot\sigma(wx)(1-\sigma(wx))\cdot x.`}</DisplayMath>
          <p>
            Via AD: compute the forward pass (get <InlineMath>{'L'}</InlineMath>), then a backward
            pass propagates <InlineMath>{'\\bar{L}=1'}</InlineMath> through each node automatically.
            The same formula emerges — but for a network with millions of parameters, no human
            needs to derive the chain-rule expansion manually. AD handles it.
          </p>
        </div>
      </section>

      {/* ── Looking ahead ── */}
      <section className="lesson-section">
        <h2 className="section-title"><span className="section-tag ahead-tag">LOOKING AHEAD</span></h2>
        <div className="content-block">
          <div className="callout callout-success">
            Module 8 moves from functions of one variable to <em>systems</em> of equations that evolve
            in time. Lecture 36 introduces ordinary differential equations and numerical integration —
            where AD-computed Jacobians appear again as the linearization used by implicit ODE solvers.
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
              <div className="app-icon">🧠</div>
              <h3>Neural Network Training</h3>
              <p>
                Reverse-mode AD (backpropagation) is how every modern neural network trains. PyTorch's
                autograd builds a dynamic computation graph on the forward pass, then differentiates
                backwards through it. Training a ResNet-50 computes gradients for 25 million parameters
                in one backward sweep.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">🤖</div>
              <h3>Differentiable Robotics Simulators</h3>
              <p>
                Packages like DiffTaichi and Brax implement physics simulators in AD-compatible
                frameworks, so you can differentiate through a robot simulation to compute
                <InlineMath>{'\\partial \\text{cost}/\\partial \\text{control}'}</InlineMath> for
                trajectory optimization.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Jacobian Computation in EKF</h3>
              <p>
                The Extended Kalman Filter needs the Jacobian of the process model
                <InlineMath>{'\\;F = \\partial f/\\partial x'}</InlineMath>. If the model is code
                rather than a closed-form formula, forward-mode AD computes each column of
                <InlineMath>{'\\;F'}</InlineMath> with one pass per input dimension.
              </p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚡</div>
              <h3>Implicit ODE Solvers</h3>
              <p>
                Stiff ODE solvers (Radau, BDF) require the Jacobian
                <InlineMath>{'\\;\\partial f/\\partial y'}</InlineMath> of the right-hand side to
                solve implicit equations at each step. AD computes this Jacobian without symbolic
                manipulation or finite-difference approximation.
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
            question="What is the main advantage of automatic differentiation over finite differences?"
            options={[
              'AD is faster for functions with many outputs',
              'AD is exact to machine precision — no truncation error and no step-size tuning required',
              'AD works only for polynomials, which is why it is exact',
              'AD avoids the chain rule by using numerical integration instead',
            ]}
            correct={1}
            explanation="Finite differences introduce truncation error O(h) plus floating-point cancellation — there is no ideal h. AD propagates derivatives exactly using arithmetic rules (the chain rule), so the error is only due to floating-point rounding in the underlying computation, typically ~10^(−15) for double precision."
          />
          <QuizQ
            num={2} type="Computation"
            question="Seeding x = (2, 1) and computing v = x·x via dual arithmetic gives:"
            options={[
              '(4, 4)',
              '(4, 2)',
              '(2, 4)',
              '(4, 1)',
            ]}
            correct={0}
            explanation="Dual product rule: (a, a')·(b, b') = (a·b, a·b' + a'·b). With a = b = 2 and a' = b' = 1: value = 2·2 = 4, derivative = 2·1 + 1·2 = 4. So v = (4, 4). This matches d/dx[x²] = 2x = 2·2 = 4. ✓"
          />
          <QuizQ
            num={3} type="Concept"
            question="Reverse-mode AD is preferred over forward mode when:"
            options={[
              'The function has many inputs and one scalar output (e.g., a loss function)',
              'The function has one input and many outputs',
              'The computation graph is very deep',
              'The function is implemented in a compiled language',
            ]}
            correct={0}
            explanation="Forward mode computes one directional derivative per pass — efficient when inputs are few. Reverse mode computes the full gradient in one backward pass — efficient when there is one scalar output (like a loss) with many inputs (like neural network parameters). That is why backpropagation uses reverse mode."
          />
          <QuizQ
            num={4} type="Transfer"
            question="An EKF needs ∂f/∂x (the process Jacobian) where f is a 3D-to-3D function implemented as code. Which AD mode is more efficient?"
            options={[
              'Reverse mode: one backward pass gives all partial derivatives',
              'Forward mode: 3 passes (one per input dimension) give all 9 entries of the Jacobian',
              'Both modes are equally efficient for square Jacobians',
              'Neither — finite differences are preferred for Jacobians',
            ]}
            correct={2}
            explanation="For an n-to-m Jacobian, forward mode costs n passes and reverse mode costs m passes. When n = m = 3, both cost exactly 3 passes and are equivalent. For n >> m, reverse mode wins; for m >> n, forward mode wins. Square Jacobians (same n and m) are a tie."
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
              Write the dual-number product rule. Manually trace forward-mode AD for
              <InlineMath>{'f(x) = x^3'}</InlineMath> at <InlineMath>{'x = 2'}</InlineMath>.
            </div>
            <div className="review-item">
              <span className="review-day">Day 1</span>
              Explain in one paragraph why finite-difference derivatives are unreliable for very
              small <InlineMath>{'h'}</InlineMath>. What is AD's answer to this problem?
            </div>
            <div className="review-item">
              <span className="review-day">Day 3</span>
              Describe the two phases of reverse-mode AD. What is stored during the forward pass
              and why?
            </div>
            <div className="review-item">
              <span className="review-day">Day 7</span>
              A loss function <InlineMath>{'L'}</InlineMath> has 1000 parameters. Compare the cost
              of forward-mode vs. reverse-mode AD in passes. Which do you choose and why?
            </div>
            <div className="review-item">
              <span className="review-day">Day 14</span>
              Without notes: state the dual-number rules for addition, multiplication, and
              <InlineMath>{'\\sin'}</InlineMath>. Explain how seeding with
              <InlineMath>{'(x_0,\\,1)'}</InlineMath> extracts <InlineMath>{'f^{\\prime}(x_0)'}</InlineMath>.
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
