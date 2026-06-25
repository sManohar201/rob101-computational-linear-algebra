import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#eafaf1', color: '#196f3d', borderColor: '#a9dfbf' }
const W = 360, H = 280

// Feasible polytope vertices (SVG coords): triangle
const V = [[60, 240], [180, 60], [300, 240]]
const polyPts = V.map(p => p.join(',')).join(' ')

// LP: minimize c·x (c=[0,-1], minimize -y → maximize y) → vertex at (180,60) = top
// QP: minimize |x − target|² where target = (260, 160) → on edge (180,60)-(300,240)

function closestOnSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return { x: ax, y: ay }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  return { x: ax + t * dx, y: ay + t * dy }
}

function nearestFeasiblePoint(px, py) {
  let best = null, bestDist = Infinity
  for (let i = 0; i < V.length; i++) {
    const [ax, ay] = V[i], [bx, by] = V[(i + 1) % V.length]
    const p = closestOnSegment(px, py, ax, ay, bx, by)
    const d = (p.x - px) ** 2 + (p.y - py) ** 2
    if (d < bestDist) { bestDist = d; best = p }
  }
  V.forEach(([vx, vy]) => {
    const d = (vx-px)**2 + (vy-py)**2
    if (d < bestDist) { bestDist = d; best = { x: vx, y: vy } }
  })
  return best
}

// Check point inside triangle
function insidePoly(px, py) {
  const sign = (ax,ay,bx,by) => (bx-ax)*(py-ay) - (by-ay)*(px-ax)
  const s = [sign(...V[0],...V[1]), sign(...V[1],...V[2]), sign(...V[2],...V[0])]
  return s.every(v => v >= 0) || s.every(v => v <= 0)
}

function LPQPWidget() {
  const [mode, setMode] = useState('LP')
  const [step, setStep] = useState(0)
  const [tgtX, setTgtX] = useState(260)
  const [tgtY, setTgtY] = useState(160)
  const [dragging, setDragging] = useState(false)

  const LP_PATH = [V[0], V[1]] // simplex goes from V[0] to V[1] (top = max y = min -y)
  const lpSteps = useMemo(() => LP_PATH, [])

  const { optX, optY } = useMemo(() => {
    if (mode === 'LP') {
      return { optX: V[1][0], optY: V[1][1] }
    } else {
      if (insidePoly(tgtX, tgtY)) return { optX: tgtX, optY: tgtY }
      const p = nearestFeasiblePoint(tgtX, tgtY)
      return { optX: p.x, optY: p.y }
    }
  }, [mode, tgtX, tgtY])

  const handleMouseMove = (e) => {
    if (!dragging || mode !== 'QP') return
    const rect = e.currentTarget.getBoundingClientRect()
    setTgtX(Math.round(e.clientX - rect.left))
    setTgtY(Math.round(e.clientY - rect.top))
  }

  const rings = [30, 60, 90, 120]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['LP', 'QP'].map(m => (
          <button key={m} onClick={() => { setMode(m); setStep(0) }} style={{
            padding: '5px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
            background: mode === m ? '#196f3d' : '#f0faf4',
            color: mode === m ? '#fff' : '#196f3d',
            border: '1px solid #a9dfbf', fontWeight: 600
          }}>{m === 'LP' ? 'Linear Program (LP)' : 'Quadratic Program (QP)'}</button>
        ))}
      </div>
      <svg width={W} height={H}
        style={{ background: '#f0fdf4', borderRadius: 8, border: '1px solid #a9dfbf', cursor: mode === 'QP' ? 'crosshair' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}>
        {mode === 'LP' ? (
          Array.from({ length: 5 }, (_, i) => {
            const y = 80 + i * 44
            return <line key={i} x1={20} y1={y} x2={W-20} y2={y} stroke="#c8e6c9" strokeWidth={1} strokeDasharray="4,4" />
          })
        ) : (
          rings.map(r => (
            <ellipse key={r} cx={tgtX} cy={tgtY} rx={r} ry={r * 0.7}
              fill="none" stroke="#c8e6c9" strokeWidth={1} strokeDasharray="4,4" />
          ))
        )}
        <polygon points={polyPts} fill="#a9dfbf" fillOpacity={0.35} stroke="#196f3d" strokeWidth={2} />
        {V.map(([vx,vy], i) => (
          <circle key={i} cx={vx} cy={vy} r={5} fill="#196f3d" />
        ))}
        {mode === 'LP' && (
          <>
            <line x1={V[0][0]} y1={V[0][1]} x2={V[1][0]} y2={V[1][1]}
              stroke="#e67e22" strokeWidth={2.5} strokeDasharray="7,4" />
            <text x={(V[0][0]+V[1][0])/2 + 8} y={(V[0][1]+V[1][1])/2} fontSize={10} fill="#e67e22">simplex path</text>
          </>
        )}
        {mode === 'QP' && (
          <>
            <circle cx={tgtX} cy={tgtY} r={7} fill="#e67e22" />
            <text x={tgtX + 9} y={tgtY - 5} fontSize={10} fill="#e67e22">target (drag me)</text>
            <line x1={tgtX} y1={tgtY} x2={optX} y2={optY}
              stroke="#c0392b" strokeWidth={1.5} strokeDasharray="4,3" />
          </>
        )}
        <circle cx={optX} cy={optY} r={8} fill="#c0392b" stroke="#fff" strokeWidth={2} />
        <text x={optX + 10} y={optY - 4} fontSize={11} fill="#c0392b" fontWeight={600}>
          {mode === 'LP' ? 'LP optimum (vertex)' : 'QP optimum'}
        </text>
        <text x={24} y={20} fontSize={10} fill="#555">
          {mode === 'LP' ? 'Minimize −y: sweep horizontal contours downward' : 'Minimize ||x−target||²: drag target'}
        </text>
      </svg>
      <div style={{ fontSize: 12, color: '#196f3d', background: '#eafaf1', padding: '6px 16px', borderRadius: 6, border: '1px solid #a9dfbf' }}>
        {mode === 'LP'
          ? `LP optimum at vertex (${V[1][0]}, ${V[1][1]}) — guaranteed corner solution`
          : `QP optimum at (${fmt(optX)}, ${fmt(optY)}) — ${insidePoly(tgtX, tgtY) ? 'interior' : 'boundary'} solution`}
      </div>
    </div>
  )
}

export default function L56() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>Linear and Quadratic Programming</h2>
        <div className="content-block">
          <p>
            Once you have a convex objective and convex constraints, you have a <em>convex
            program</em> — solvable to global optimality in polynomial time. The two most
            important special cases dominate engineering:
          </p>
          <p>
            <strong>Linear Programming (LP):</strong> linear cost
            <InlineMath math="\mathbf{c}^\top\mathbf{x}" /> over a polyhedral feasible set
            <InlineMath math="\{A\mathbf{x} \le \mathbf{b}\}" />. Because cost and constraints are
            flat, the optimum always lands at a <em>vertex</em> of the polytope. The Simplex
            algorithm walks the edges until no improving neighbor exists.
          </p>
          <p>
            <strong>Quadratic Programming (QP):</strong> quadratic cost
            <InlineMath math="\tfrac{1}{2}\mathbf{x}^\top Q\mathbf{x} + \mathbf{c}^\top\mathbf{x}" />
            with polyhedral constraints. The curved cost contours can push the optimum onto
            an edge or even into the interior. Active-set and interior-point methods solve QPs
            efficiently — MPC controllers run QPs at 1 kHz onboard real robots.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — LP Vertex vs QP Boundary</span>
        <div className="content-block">
          <p>
            In <strong>LP mode</strong>, the Simplex path walks from a starting vertex to the
            optimal corner. In <strong>QP mode</strong>, drag the target point — when the target
            is inside the polytope, the QP optimum is the target itself; when it's outside,
            the optimum projects onto the boundary.
          </p>
          <LPQPWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>Standard LP</h3>
          <DisplayMath math="\min_{\mathbf{x}} \mathbf{c}^\top\mathbf{x} \quad\text{s.t.}\quad A\mathbf{x} \le \mathbf{b},\ \mathbf{x} \ge \mathbf{0}" />
          <p>
            Optimal solution is always a <em>basic feasible solution</em> (BFS) — a vertex of the
            feasible polytope where <InlineMath math="n" /> constraints are tight. Number of vertices
            is at most <InlineMath math="\binom{m}{n}" />; Simplex visits only a tiny fraction.
          </p>
          <h3>Standard QP</h3>
          <DisplayMath math="\min_{\mathbf{x}} \tfrac{1}{2}\mathbf{x}^\top Q\mathbf{x} + \mathbf{c}^\top\mathbf{x} \quad\text{s.t.}\quad A\mathbf{x} \le \mathbf{b}" />
          <p>
            When <InlineMath math="Q \succ 0" />, the problem is strictly convex with a unique
            global minimum. KKT conditions:
          </p>
          <DisplayMath math="Q\mathbf{x}^* + \mathbf{c} + A^\top\boldsymbol{\mu}^* = \mathbf{0}, \quad \mu_i^*(A_i\mathbf{x}^* - b_i) = 0, \quad \boldsymbol{\mu}^* \ge \mathbf{0}" />
          <h3>LP Duality</h3>
          <p>Every LP has a dual: <InlineMath math="\max_{\mathbf{y}} \mathbf{b}^\top\mathbf{y}" /> s.t. <InlineMath math="A^\top\mathbf{y} = \mathbf{c}, \mathbf{y} \ge \mathbf{0}" />. Strong duality: primal = dual at optimality. The dual variables are the LP shadow prices.</p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>
            Minimize <InlineMath math="f = -x - y" /> subject to <InlineMath math="x,y \ge 0" />,
            <InlineMath math="x + 2y \le 4" />.
          </p>
          <p>Vertices of feasible region: <InlineMath math="(0,0), (4,0), (0,2)" />.</p>
          <div style={{ fontFamily: 'monospace', background: '#eafaf1', padding: 10, borderRadius: 6, fontSize: 12 }}>
            f(0,0) = 0 &nbsp;|&nbsp; f(4,0) = −4 ← minimum &nbsp;|&nbsp; f(0,2) = −2
          </div>
          <p>
            LP optimum at <InlineMath math="(4,0)" /> — a vertex. Simplex reaches it in one
            pivot from either neighboring vertex.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦾</div>
              <h3>Whole-Body MPC (QP)</h3>
              <p>At each 1 ms control cycle, a QP minimizes tracking error subject to friction cone constraints and joint torque limits. OSQP and qpOASES solve 1000-variable QPs in under 1 ms on embedded hardware.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📦</div>
              <h3>Task Allocation (LP)</h3>
              <p>Assigning n robots to m tasks minimizing total travel distance is an LP. The transportation simplex method solves large instances optimally, far faster than brute-force assignment.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌐</div>
              <h3>Network Flow & Path Planning</h3>
              <p>Shortest-path and flow-network problems on robot roadmaps are LPs. Dual variables give the shortest-path costs — shadow prices of routing capacity constraints.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="Why does the LP optimum always lie at a vertex of the feasible polytope?"
            options={["Linear cost is flat; the optimum is pushed to the extreme boundary corner","Linear constraints force vertices","Simplex only visits vertices","All linear problems are bounded"]}
            correct={0}
            explanation="A linear objective has zero curvature. Its level sets are parallel hyperplanes; the minimum is achieved as far in the cost direction as the polytope allows — always a vertex." />
          <QuizQ num={2} type="mc"
            question="A QP with Q ≻ 0 (positive definite) has:"
            options={["A unique global minimum","Multiple local minima","No minimum","A minimum only on vertices"]}
            correct={0}
            explanation="Q≻0 makes the QP strictly convex. A strictly convex function has exactly one global minimum — no local traps." />
          <QuizQ num={3} type="mc"
            question="In the KKT conditions for a QP, complementary slackness μᵢ(Aᵢx−bᵢ)=0 means:"
            options={["Inactive constraints have μ=0; active constraints may have μ>0","All multipliers must be zero","All constraints must be active","The gradient must vanish at all vertices"]}
            correct={0}
            explanation="If constraint i is inactive (Aᵢx<bᵢ), then μᵢ=0 (it doesn't affect the Lagrangian). If active, μᵢ≥0 measures how much the constraint is binding." />
          <QuizQ num={4} type="mc"
            question="LP strong duality says:"
            options={["Primal and dual optimal values are equal","The dual is always infeasible","Duality only holds in 2D","The dual is harder to solve"]}
            correct={0}
            explanation="For feasible LPs with bounded optima, strong duality holds: primal min = dual max. This lets you solve whichever is easier and certificate the solution via the other." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — LP: <InlineMath math="\min c^\top x, Ax \le b" /> — optimum always at a vertex (BFS); Simplex walks edges.</p>
          <p><strong>Day 1</strong> — QP: <InlineMath math="\min \tfrac{1}{2}x^\top Qx + c^\top x, Ax \le b" /> with <InlineMath math="Q \succ 0" /> → unique global min, may be interior.</p>
          <p><strong>Day 3</strong> — KKT for QP: <InlineMath math="Qx^* + c + A^\top\mu^* = 0" />, <InlineMath math="\mu^* \ge 0" />, complementary slackness.</p>
          <p><strong>Day 7</strong> — LP dual: <InlineMath math="\max b^\top y, A^\top y = c, y \ge 0" />; strong duality: primal min = dual max.</p>
          <p><strong>Day 14</strong> — Interior-point methods solve LP and QP in <InlineMath math="O(n^{3.5})" />; Simplex is exponential worst-case but fast in practice.</p>
        </div>
      </div>
    </div>
  )
}
