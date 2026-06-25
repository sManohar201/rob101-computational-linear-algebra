import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#eafaf1', color: '#196f3d', borderColor: '#a9dfbf' }
const W = 340, H = 260, CX = 170, CY = 130

const PRESETS = {
  circle:   { label: 'Circle (convex)', shape: 'circle' },
  star:     { label: 'Star (non-convex)', shape: 'star' },
  convex_f: { label: 'f(x)=x² (convex fn)', shape: 'fn_convex' },
  concave_f:{ label: 'f(x)=−x² (concave fn)', shape: 'fn_concave' },
}

function starPoly(n = 5, r1 = 65, r2 = 28, cx = CX, cy = CY) {
  const pts = []
  for (let i = 0; i < 2 * n; i++) {
    const r = i % 2 === 0 ? r1 : r2
    const a = (Math.PI * i / n) - Math.PI / 2
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
}

function insideCircle(x, y, cx, cy, r) { return (x-cx)**2 + (y-cy)**2 <= r*r }

function insideStar(x, y) {
  const pts = starPoly()
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function ConvexWidget() {
  const [preset, setPreset] = useState('circle')
  const [t, setT] = useState(0.5)

  const shape = PRESETS[preset]?.shape ?? 'circle'
  const isFnMode = shape.startsWith('fn_')

  // Two sample points for set or function
  const A = { x: CX - 60, y: CY - 20 }
  const B = { x: CX + 55, y: CY + 30 }
  const Px = (1 - t) * A.x + t * B.x
  const Py = (1 - t) * A.y + t * B.y

  const inSet = shape === 'circle'
    ? insideCircle(Px, Py, CX, CY, 75)
    : insideStar(Px, Py)

  // For function mode
  const toSvgX = v => CX + v * 50
  const toSvgY = v => CY - v * 22
  const fConvex = v => v * v
  const fConcave = v => -v * v
  const f = shape === 'fn_convex' ? fConvex : fConcave

  const xs = Array.from({ length: 80 }, (_, i) => -2.5 + i * 5 / 79)
  const fnPath = xs.map((v, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(v)},${toSvgY(f(v))}`).join(' ')

  const va = -1.2, vb = 1.6
  const fa = f(va), fb = f(vb)
  const vt = (1 - t) * va + t * vb
  const fvt = f(vt)
  const secant = (1 - t) * fa + t * fb
  const jensensHolds = shape === 'fn_convex' ? fvt <= secant : fvt >= secant

  const starPts = starPoly().map(p => `${p[0]},${p[1]}`).join(' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.entries(PRESETS).map(([k, v]) => (
          <button key={k} onClick={() => setPreset(k)} style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: preset === k ? '#196f3d' : '#f0faf4',
            color: preset === k ? '#fff' : '#196f3d',
            border: '1px solid #a9dfbf'
          }}>{v.label}</button>
        ))}
      </div>
      <svg width={W} height={H} style={{ background: '#f0fdf4', borderRadius: 8, border: '1px solid #a9dfbf' }}>
        {isFnMode ? (
          <>
            <line x1={30} y1={CY} x2={W-20} y2={CY} stroke="#ccc" strokeWidth={1} />
            <line x1={CX} y1={10} x2={CX} y2={H-20} stroke="#ccc" strokeWidth={1} />
            <path d={fnPath} fill="none" stroke="#196f3d" strokeWidth={2.5} />
            <line x1={toSvgX(va)} y1={toSvgY(fa)} x2={toSvgX(vb)} y2={toSvgY(fb)}
              stroke="#e67e22" strokeWidth={2} strokeDasharray="5,3" />
            <circle cx={toSvgX(vt)} cy={toSvgY(secant)} r={5} fill="#e67e22" />
            <circle cx={toSvgX(vt)} cy={toSvgY(fvt)} r={5} fill="#196f3d" />
            <line x1={toSvgX(vt)} y1={toSvgY(fvt)} x2={toSvgX(vt)} y2={toSvgY(secant)}
              stroke={jensensHolds ? '#196f3d' : '#c0392b'} strokeWidth={2} />
            <text x={toSvgX(vt) + 7} y={toSvgY((fvt+secant)/2)} fontSize={10}
              fill={jensensHolds ? '#196f3d' : '#c0392b'}>
              {jensensHolds ? 'f(tx)≤secant ✓' : 'f(tx)≥secant'}
            </text>
            <text x={26} y={18} fontSize={10} fill="#196f3d">— function</text>
            <text x={26} y={30} fontSize={10} fill="#e67e22">— secant</text>
          </>
        ) : (
          <>
            {shape === 'circle'
              ? <circle cx={CX} cy={CY} r={75} fill="#a9dfbf" fillOpacity={0.4} stroke="#196f3d" strokeWidth={2} />
              : <polygon points={starPts} fill="#a9dfbf" fillOpacity={0.4} stroke="#196f3d" strokeWidth={2} />}
            <circle cx={A.x} cy={A.y} r={5} fill="#2471a3" />
            <circle cx={B.x} cy={B.y} r={5} fill="#2471a3" />
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke={inSet ? '#196f3d' : '#c0392b'} strokeWidth={2} />
            <circle cx={Px} cy={Py} r={6}
              fill={inSet ? '#196f3d' : '#c0392b'} />
            <text x={26} y={18} fontSize={11} fill={inSet ? '#196f3d' : '#c0392b'}>
              {inSet ? 'Midpoint inside set ✓' : 'Midpoint OUTSIDE set ✗'}
            </text>
          </>
        )}
      </svg>
      <div style={{ width: '100%', maxWidth: 320 }}>
        <SliderRow label="t (interpolation)" min={0} max={1} step={0.02} value={t} onChange={setT} />
      </div>
    </div>
  )
}

export default function L54() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>Convex Sets and Convex Functions</h2>
        <div className="content-block">
          <p>
            Convexity is the single property that makes large-scale optimization tractable.
            A <strong>convex set</strong> contains the entire line segment between any two of its
            points — no dents, no holes. A <strong>convex function</strong> curves upward everywhere,
            meaning any chord between two points on the graph lies above the graph.
          </p>
          <p>
            Why does this matter? Every local minimum of a convex function is a global minimum.
            There are no valleys to get stuck in, no saddle points to confuse gradient descent.
            The theory says: find where the gradient vanishes and you have found the answer.
          </p>
          <p>
            Robotics optimization is often convex by design: least-squares fitting, portfolio
            allocation, SVM training, LASSO regularization — all convex programs solvable to
            global optimality in polynomial time.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — Convexity Tester</span>
        <div className="content-block">
          <p>
            Switch between set mode (does the segment <InlineMath math="\theta A + (1-\theta)B" /> stay inside?)
            and function mode (is the secant above the function curve?). Jensen's inequality holds
            when <InlineMath math="f(\theta x + (1-\theta)y) \le \theta f(x) + (1-\theta)f(y)" />.
          </p>
          <ConvexWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>Convex Sets</h3>
          <p>
            A set <InlineMath math="C \subseteq \mathbb{R}^n" /> is <em>convex</em> if
          </p>
          <DisplayMath math="\theta \mathbf{x} + (1-\theta)\mathbf{y} \in C \quad\forall\, \mathbf{x},\mathbf{y} \in C,\ \theta \in [0,1]" />
          <p>Examples: halfspaces, ellipsoids, the positive semidefinite cone <InlineMath math="\mathbb{S}^n_+" />.</p>
          <h3>Convex Functions</h3>
          <p>
            <InlineMath math="f: \mathbb{R}^n \to \mathbb{R}" /> is <em>convex</em> if
            <InlineMath math="\text{dom}(f)" /> is convex and
          </p>
          <DisplayMath math="f(\theta \mathbf{x} + (1-\theta)\mathbf{y}) \le \theta f(\mathbf{x}) + (1-\theta)f(\mathbf{y})" />
          <p><strong>First-order condition:</strong> if differentiable,</p>
          <DisplayMath math="f(\mathbf{y}) \ge f(\mathbf{x}) + \nabla f(\mathbf{x})^\top(\mathbf{y}-\mathbf{x}) \quad\forall\, \mathbf{x},\mathbf{y}" />
          <p>The tangent hyperplane is a global underestimator.</p>
          <p><strong>Second-order condition:</strong> <InlineMath math="\nabla^2 f(\mathbf{x}) \succeq 0" /> everywhere.</p>
          <h3>Jensen's Inequality</h3>
          <DisplayMath math="f\!\left(\sum_i \theta_i \mathbf{x}_i\right) \le \sum_i \theta_i f(\mathbf{x}_i), \quad \theta_i \ge 0,\ \sum_i \theta_i = 1" />
          <p>Key identity powering ML: <InlineMath math="f(\mathbb{E}[X]) \le \mathbb{E}[f(X)]" /> for convex <InlineMath math="f" />.</p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>Verify convexity of <InlineMath math="f(x) = x^2" /> at <InlineMath math="x=1, y=3, \theta=0.5" />.</p>
          <DisplayMath math="f(0.5 \cdot 1 + 0.5 \cdot 3) = f(2) = 4" />
          <DisplayMath math="0.5 f(1) + 0.5 f(3) = 0.5 + 4.5 = 5" />
          <p>
            <InlineMath math="4 \le 5" /> ✓. The second-order check: <InlineMath math="\nabla^2 f = 2 > 0" /> everywhere — confirming convexity.
          </p>
          <p>
            Now check <InlineMath math="f(x) = -x^2" />: <InlineMath math="\nabla^2 f = -2 < 0" /> — strictly concave, not convex.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🏗️</div>
              <h3>Collision-Free Corridors</h3>
              <p>In obstacle environments, planners carve convex polytope corridors. Any straight-line path between waypoints inside is collision-free by the definition of convexity — no intersection check needed.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🤖</div>
              <h3>LASSO & Sparse Control</h3>
              <p>The ℓ₁ norm ||u||₁ is convex — penalizing it in an MPC cost function promotes sparse actuation (few joints active), which saves energy. Convexity guarantees the solver finds the global minimum.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚡</div>
              <h3>SVM Max-Margin Classifier</h3>
              <p>The SVM training problem is a convex QP. Jensen's inequality guarantees the optimal hyperplane is the unique global maximum-margin separator — no local optima to escape.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="Which function is NOT convex?"
            options={["f(x) = eˣ","f(x) = x²","f(x) = −x²","f(x) = |x|"]}
            correct={2}
            explanation="−x² has ∇²f = −2 < 0 everywhere — it is strictly concave. The others (eˣ, x², |x|) are all convex." />
          <QuizQ num={2} type="mc"
            question="For a convex function, every local minimum is:"
            options={["A global minimum","A saddle point","A maximum","Not guaranteed to exist"]}
            correct={0}
            explanation="Convexity ensures the function has no local minima that are not global. Any stationary point is the global minimum." />
          <QuizQ num={3} type="mc"
            question="The first-order condition for convexity states that the tangent hyperplane at x is:"
            options={["A global underestimator of f","A global overestimator of f","Tangent to every level set","Equal to f everywhere"]}
            correct={0}
            explanation="f(y) ≥ f(x) + ∇f(x)ᵀ(y−x) for all y — the tangent plane lies below (or touches) the function graph." />
          <QuizQ num={4} type="mc"
            question="The intersection of two convex sets is:"
            options={["Always convex","Never convex","Convex only in 2D","Depends on the sets"]}
            correct={0}
            explanation="Convexity is preserved under intersection: if x,y are in both C₁ and C₂, the segment θx+(1−θ)y lies in both, hence in their intersection." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — Convex set: <InlineMath math="\theta x + (1-\theta)y \in C" /> for all <InlineMath math="x,y \in C, \theta \in [0,1]" />.</p>
          <p><strong>Day 1</strong> — Convex function: chord above graph; 2nd order: <InlineMath math="\nabla^2 f \succeq 0" />.</p>
          <p><strong>Day 3</strong> — 1st-order condition: <InlineMath math="f(y) \ge f(x) + \nabla f(x)^\top(y-x)" /> — tangent plane underestimates.</p>
          <p><strong>Day 7</strong> — Jensen's inequality: <InlineMath math="f(\mathbb{E}[X]) \le \mathbb{E}[f(X)]" /> — powers many ML bounds.</p>
          <p><strong>Day 14</strong> — For convex f: every local minimum is global; gradient = 0 iff global minimum.</p>
        </div>
      </div>
    </div>
  )
}
