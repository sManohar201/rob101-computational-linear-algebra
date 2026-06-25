import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#eafaf1', color: '#196f3d', borderColor: '#a9dfbf' }
const W = 360, H = 300, SCALE = 80
const CX = 160, CY = 150

function LagrangeWidget() {
  const [cx, setCx] = useState(1.4)
  const [cy, setCy] = useState(1.0)
  const [r, setR] = useState(0.8)

  const { optX, optY, lam, cost } = useMemo(() => {
    const len = Math.sqrt(cx * cx + cy * cy)
    const optX = cx - r * cx / len
    const optY = cy - r * cy / len
    const cost = optX * optX + optY * optY
    const gradfX = 2 * optX, gradfY = 2 * optY
    const gradgX = 2 * (optX - cx), gradgY = 2 * (optY - cy)
    const gLen = Math.sqrt(gradgX**2 + gradgY**2)
    const lam = gLen > 0.001 ? -Math.sqrt(gradfX**2 + gradfY**2) / gLen : 0
    return { optX, optY, lam, cost }
  }, [cx, cy, r])

  const toSvg = (x, y) => ({ sx: CX + x * SCALE, sy: CY - y * SCALE })

  const { sx: ox, sy: oy } = toSvg(optX, optY)
  const { sx: ccx, sy: ccy } = toSvg(cx, cy)

  const nRings = 4
  const ringPts = Array.from({ length: nRings }, (_, i) => {
    const rr = 0.3 + i * 0.5
    const pts = Array.from({ length: 60 }, (_, j) => {
      const a = 2 * Math.PI * j / 59
      const { sx, sy } = toSvg(rr * Math.cos(a), rr * Math.sin(a))
      return `${sx},${sy}`
    }).join(' ')
    return pts
  })

  const gradfX = 2 * optX, gradfY = 2 * optY
  const gradgX = 2 * (optX - cx), gradgY = 2 * (optY - cy)
  const fLen = Math.sqrt(gradfX**2 + gradfY**2)
  const gLen = Math.sqrt(gradgX**2 + gradgY**2)
  const sc = 30
  const fx2 = ox + (gradfX / fLen) * sc, fy2 = oy - (gradfY / fLen) * sc
  const gx2 = ox + (gradgX / gLen) * sc, gy2 = oy - (gradgY / gLen) * sc

  const constraintPts = Array.from({ length: 64 }, (_, j) => {
    const a = 2 * Math.PI * j / 63
    const { sx, sy } = toSvg(cx + r * Math.cos(a), cy + r * Math.sin(a))
    return `${sx},${sy}`
  }).join(' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={W} height={H} style={{ background: '#f0fdf4', borderRadius: 8, border: '1px solid #a9dfbf' }}>
        <defs>
          <marker id="ah55f" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#e67e22" />
          </marker>
          <marker id="ah55g" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#2471a3" />
          </marker>
        </defs>
        <line x1={20} y1={CY} x2={W-10} y2={CY} stroke="#ddd" />
        <line x1={CX} y1={10} x2={CX} y2={H-20} stroke="#ddd" />
        {ringPts.map((pts, i) => (
          <polyline key={i} points={pts} fill="none" stroke="#c8e6c9" strokeWidth={1} strokeDasharray="4,3" />
        ))}
        <polyline points={constraintPts} fill="none" stroke="#196f3d" strokeWidth={2.5} />
        <circle cx={ccx} cy={ccy} r={4} fill="#196f3d" />
        <text x={ccx + 5} y={ccy - 5} fontSize={10} fill="#196f3d">constraint center</text>
        <circle cx={ox} cy={oy} r={7} fill="#e67e22" stroke="#c0392b" strokeWidth={2} />
        <text x={ox + 9} y={oy - 5} fontSize={10} fill="#c0392b">x*</text>
        <line x1={ox} y1={oy} x2={fx2} y2={fy2}
          stroke="#e67e22" strokeWidth={2} markerEnd="url(#ah55f)" />
        <text x={fx2+3} y={fy2-3} fontSize={9} fill="#e67e22">∇f</text>
        <line x1={ox} y1={oy} x2={gx2} y2={gy2}
          stroke="#2471a3" strokeWidth={2} markerEnd="url(#ah55g)" />
        <text x={gx2+3} y={gy2-3} fontSize={9} fill="#2471a3">∇g</text>
        <text x={24} y={20} fontSize={10} fill="#888">dashed: cost contours |x|²</text>
      </svg>
      <div style={{ fontSize: 12, color: '#196f3d', background: '#eafaf1', padding: '6px 16px', borderRadius: 6, border: '1px solid #a9dfbf' }}>
        x* = ({fmt(optX)}, {fmt(optY)}) &nbsp;|&nbsp; cost = {fmt(cost)} &nbsp;|&nbsp; λ ≈ {fmt(lam)}
      </div>
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SliderRow label="Constraint center x" min={0.3} max={2.2} step={0.1} value={cx} onChange={setCx} />
        <SliderRow label="Constraint center y" min={0.3} max={2.2} step={0.1} value={cy} onChange={setCy} />
        <SliderRow label="Constraint radius r" min={0.2} max={1.5} step={0.05} value={r} onChange={setR} />
      </div>
      <div style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>
        Minimize |x|² s.t. (x−c)² = r² — at x*, ∇f and ∇g are anti-parallel
      </div>
    </div>
  )
}

export default function L55() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>Constrained Optimization and Lagrange Multipliers</h2>
        <div className="content-block">
          <p>
            Unconstrained optimization is simple: slide downhill until the gradient vanishes.
            But real engineering always has constraints: motors have torque limits, budgets are
            finite, joints have range limits. How do we minimize a function while staying on a
            boundary curve or surface?
          </p>
          <p>
            The <strong>Lagrange multiplier</strong> method answers this. At the constrained
            optimum <InlineMath math="\mathbf{x}^*" />, the gradient of the cost
            <InlineMath math="\nabla f" /> and the gradient of the constraint
            <InlineMath math="\nabla g" /> must be <em>parallel</em> — if they weren't, there
            would be a direction along the constraint that decreases <InlineMath math="f" />,
            contradicting optimality.
          </p>
          <p>
            The multiplier <InlineMath math="\lambda" /> is the proportionality constant:
            <InlineMath math="\nabla f = -\lambda \nabla g" />. It has a beautiful economic
            interpretation: <InlineMath math="\lambda = -\partial f^*/\partial b" />, the
            <strong>shadow price</strong> — how much cheaper the optimum would get if we relaxed
            the constraint by one unit.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — Gradient Alignment at Optimum</span>
        <div className="content-block">
          <p>
            Minimize <InlineMath math="\|\mathbf{x}\|^2" /> (distance to origin) subject to
            <InlineMath math="(\mathbf{x}-\mathbf{c})^\top(\mathbf{x}-\mathbf{c}) = r^2" /> (circle constraint).
            At the optimal point (orange dot), <InlineMath math="\nabla f" /> (orange) and
            <InlineMath math="\nabla g" /> (blue) are anti-parallel.
          </p>
          <LagrangeWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>Lagrangian</h3>
          <p>For problem <InlineMath math="\min_{\mathbf{x}} f(\mathbf{x})" /> s.t. <InlineMath math="g_i(\mathbf{x}) = 0,\ i=1,\ldots,m" />:</p>
          <DisplayMath math="\mathcal{L}(\mathbf{x}, \boldsymbol{\lambda}) = f(\mathbf{x}) + \sum_{i=1}^m \lambda_i g_i(\mathbf{x})" />
          <h3>KKT Stationarity Conditions</h3>
          <p>At any local optimum:</p>
          <DisplayMath math="\nabla_{\mathbf{x}} \mathcal{L} = \nabla f(\mathbf{x}^*) + \sum_i \lambda_i^* \nabla g_i(\mathbf{x}^*) = \mathbf{0}" />
          <DisplayMath math="g_i(\mathbf{x}^*) = 0,\quad i = 1,\ldots,m" />
          <h3>Inequality Constraints (KKT)</h3>
          <p>For <InlineMath math="h_j(\mathbf{x}) \le 0" />, add multipliers <InlineMath math="\mu_j \ge 0" /> with complementary slackness:</p>
          <DisplayMath math="\mu_j h_j(\mathbf{x}^*) = 0,\quad \mu_j \ge 0" />
          <p>
            An inequality constraint is <em>active</em> if <InlineMath math="h_j(\mathbf{x}^*) = 0" />
            (binding), and <em>inactive</em> if <InlineMath math="h_j(\mathbf{x}^*) < 0" />
            (slack, so <InlineMath math="\mu_j = 0" />).
          </p>
          <h3>Shadow Price Interpretation</h3>
          <p>
            If the constraint is <InlineMath math="g(\mathbf{x}) = b" />, then
            <InlineMath math="\lambda^* = -\partial f^*(\mathbf{x}^*)/\partial b" />:
            tightening the constraint by <InlineMath math="db" /> increases cost by
            <InlineMath math="-\lambda^* db" />.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>
            Minimize <InlineMath math="f(x,y) = x^2 + y^2" /> subject to <InlineMath math="x + y = 2" />.
          </p>
          <DisplayMath math="\mathcal{L}(x,y,\lambda) = x^2 + y^2 + \lambda(x + y - 2)" />
          <p><strong>Stationarity:</strong></p>
          <DisplayMath math="\partial_x \mathcal{L} = 2x + \lambda = 0 \implies x = -\lambda/2" />
          <DisplayMath math="\partial_y \mathcal{L} = 2y + \lambda = 0 \implies y = -\lambda/2" />
          <p><strong>Constraint:</strong> <InlineMath math="x + y = 2 \implies -\lambda = 2 \implies \lambda = -2" /></p>
          <p>
            So <InlineMath math="x^* = y^* = 1" />, <InlineMath math="f^* = 2" />.
            The shadow price: relaxing to <InlineMath math="x+y=2+\epsilon" /> reduces cost by
            <InlineMath math="-\lambda^* \epsilon = 2\epsilon" />.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦿</div>
              <h3>Torque-Limited Inverse Kinematics</h3>
              <p>Minimize joint velocity subject to the constraint that the end-effector tracks a desired velocity. Lagrange multipliers identify which joint torque limits are active (binding) and by how much.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">💡</div>
              <h3>Power-Constrained Control</h3>
              <p>Minimize tracking error subject to total motor power ≤ budget. The shadow price λ tells you exactly how much tracking improves per Watt of extra power budget — direct hardware design guidance.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📐</div>
              <h3>Workspace Boundary Navigation</h3>
              <p>Near singularities, KKT conditions detect which joint limits are active. The MPC controller switches to equality-constrained subproblems at each active set, maintaining safety.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="At the Lagrange optimum, the gradients ∇f and ∇g are:"
            options={["Parallel (anti-parallel)","Perpendicular","Equal","Zero"]}
            correct={0}
            explanation="The KKT condition ∇f + λ∇g = 0 means ∇f = −λ∇g — the two gradients are parallel (pointing in opposite directions when λ>0)." />
          <QuizQ num={2} type="mc"
            question="The shadow price λ* represents:"
            options={["How much the optimal cost changes per unit relaxation of the constraint","The distance to the constraint","The second derivative of f","The step size for gradient descent"]}
            correct={0}
            explanation="λ* = −∂f*/∂b: if the constraint boundary moves by db, the optimal cost changes by −λ* db — the marginal value of relaxing the constraint." />
          <QuizQ num={3} type="mc"
            question="For an inequality constraint h(x) ≤ 0, complementary slackness μh(x*) = 0 means:"
            options={["Either the constraint is active (h=0) or its multiplier is zero (μ=0), not both","Both are always zero","The constraint is always violated","The cost is zero"]}
            correct={0}
            explanation="Complementary slackness: an inactive constraint (h<0) contributes nothing to the Lagrangian (μ=0); an active one (h=0) may have μ>0." />
          <QuizQ num={4} type="mc"
            question="Adding a new equality constraint to an unconstrained minimum generally:"
            options={["Increases the optimal cost (makes it worse)","Decreases the optimal cost","Has no effect","Cannot be determined"]}
            correct={0}
            explanation="Constraints restrict the feasible set. If the unconstrained minimum satisfies the constraint, cost stays the same; otherwise, the feasible minimum is worse." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — Lagrangian: <InlineMath math="\mathcal{L}(x,\lambda) = f(x) + \lambda^\top g(x)" />; set <InlineMath math="\nabla_x \mathcal{L} = 0" /> and <InlineMath math="g(x^*) = 0" />.</p>
          <p><strong>Day 1</strong> — Gradient alignment: at x*, <InlineMath math="\nabla f = -\lambda \nabla g" /> — no descent direction along the constraint exists.</p>
          <p><strong>Day 3</strong> — KKT conditions add inequality: <InlineMath math="\mu_j \ge 0" />, <InlineMath math="\mu_j h_j(x^*) = 0" /> (complementary slackness).</p>
          <p><strong>Day 7</strong> — Shadow price: <InlineMath math="\lambda^* = -\partial f^*/\partial b" /> — marginal cost of tightening the constraint.</p>
          <p><strong>Day 14</strong> — Dual problem: maximizing <InlineMath math="\inf_x \mathcal{L}(x,\lambda)" /> over <InlineMath math="\lambda" /> gives a lower bound (strong duality holds for convex problems).</p>
        </div>
      </div>
    </div>
  )
}
