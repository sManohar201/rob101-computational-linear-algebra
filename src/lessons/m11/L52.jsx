import { useState, useMemo, useCallback } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#fef0e7', color: '#922b21', borderColor: '#f5cba7' }
const W = 360, H = 240
const TRUE_SLOPE = 0.6

function initPoints() {
  const pts = []
  for (let i = 1; i <= 8; i++) {
    const x = i * 0.25
    pts.push({ x, y: TRUE_SLOPE * x + (Math.random() - 0.5) * 0.18, id: i })
  }
  return pts
}

function runRLS(pts, lam) {
  let theta = 0, P = 100
  const trace = []
  pts.forEach(p => {
    const h = p.x
    const k = (P * h) / (lam + P * h * h)
    theta = theta + k * (p.y - h * theta)
    P = (P - k * h * P) / lam
    trace.push({ x: p.x, theta: theta, P })
  })
  return { theta, P, trace }
}

function toSVG(x, y) {
  return { sx: 30 + (x / 2.2) * (W - 50), sy: H - 25 - ((y + 0.2) / 1.8) * (H - 40) }
}

function RLSWidget() {
  const [lam, setLam] = useState(0.97)
  const [pts, setPts] = useState(initPoints)
  const [nextId, setNextId] = useState(9)

  const { theta, P, trace } = useMemo(() => runRLS(pts, lam), [pts, lam])

  const addPoint = useCallback(() => {
    const x = 0.2 + Math.random() * 1.8
    const y = TRUE_SLOPE * x + (Math.random() - 0.5) * 0.25
    setPts(p => [...p, { x, y, id: nextId }])
    setNextId(n => n + 1)
  }, [nextId])

  const addOutlier = useCallback(() => {
    const x = 0.5 + Math.random() * 1.2
    const y = -0.4 - Math.random() * 0.3
    setPts(p => [...p, { x, y, id: nextId, outlier: true }])
    setNextId(n => n + 1)
  }, [nextId])

  const reset = useCallback(() => { setPts(initPoints()); setNextId(9) }, [])

  const p0 = toSVG(0, 0), p1 = toSVG(2.1, theta * 2.1)
  const truth0 = toSVG(0, 0), truth1 = toSVG(2.1, TRUE_SLOPE * 2.1)

  const tracePath = trace.length > 1
    ? trace.map((t, i) => {
        const { sx, sy } = toSVG(t.x, t.theta * t.x)
        return i === 0 ? `M${sx},${sy}` : `L${sx},${sy}`
      }).join(' ')
    : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={W} height={H} style={{ background: '#fff9f5', borderRadius: 8, border: '1px solid #f5cba7' }}>
        <line x1={30} y1={H-25} x2={W-10} y2={H-25} stroke="#ddd" />
        <line x1={30} y1={10} x2={30} y2={H-25} stroke="#ddd" />
        <line x1={truth0.sx} y1={truth0.sy} x2={truth1.sx} y2={truth1.sy}
          stroke="#aed6f1" strokeWidth={1.5} strokeDasharray="6,4" />
        <text x={truth1.sx - 30} y={truth1.sy - 6} fontSize={10} fill="#2471a3">true</text>
        {tracePath && <path d={tracePath} fill="none" stroke="#e59866" strokeWidth={1} strokeDasharray="3,2" />}
        <line x1={p0.sx} y1={p0.sy} x2={p1.sx} y2={p1.sy}
          stroke="#922b21" strokeWidth={2.5} />
        {pts.map(p => {
          const { sx, sy } = toSVG(p.x, p.y)
          return <circle key={p.id} cx={sx} cy={sy} r={4}
            fill={p.outlier ? '#c0392b' : '#7fb3d3'}
            stroke={p.outlier ? '#922b21' : '#2471a3'} strokeWidth={1} />
        })}
        <text x={36} y={18} fontSize={10} fill="#2471a3">— true slope {TRUE_SLOPE}</text>
        <text x={36} y={30} fontSize={10} fill="#922b21">— RLS fit</text>
        <text x={W-120} y={18} fontSize={10} fill="#aaa">n = {pts.length}</text>
      </svg>
      <div style={{ fontSize: 12, color: '#6e2e22', background: '#fef0e7', padding: '6px 16px', borderRadius: 6, border: '1px solid #f5cba7' }}>
        θ̂ = {fmt(theta)} &nbsp;|&nbsp; P = {fmt(P)} &nbsp;|&nbsp; true slope = {TRUE_SLOPE}
      </div>
      <div style={{ width: '100%', maxWidth: 340 }}>
        <SliderRow label="λ (forgetting)" min={0.8} max={1.0} step={0.01} value={lam} onChange={setLam} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={addPoint} style={{ padding: '6px 14px', borderRadius: 6, background: '#2471a3', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>+ Data point</button>
        <button onClick={addOutlier} style={{ padding: '6px 14px', borderRadius: 6, background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>+ Outlier</button>
        <button onClick={reset} style={{ padding: '6px 14px', borderRadius: 6, background: '#555', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>Reset</button>
      </div>
    </div>
  )
}

export default function L52() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>Recursive Least Squares</h2>
        <div className="content-block">
          <p>
            Batch least squares solves <InlineMath math="(A^\top A)\hat{x} = A^\top b" /> with all
            data in hand. But what if measurements arrive one at a time — a sensor streaming at
            100 Hz, a production line outputting items continuously, a robot updating its model
            mid-task? Recomputing from scratch each time is prohibitive.
          </p>
          <p>
            <strong>Recursive Least Squares (RLS)</strong> processes each new measurement in
            <em>O(n²)</em> time (vs <em>O(mn²)</em> for batch) by maintaining a running estimate
            <InlineMath math="\hat{\mathbf{x}}_k" /> and an inverse covariance <InlineMath math="P_k" />,
            updating both with each new data point.
          </p>
          <p>
            The <strong>forgetting factor</strong> <InlineMath math="\lambda \in (0,1]" /> exponentially
            discounts old observations, allowing RLS to track slowly drifting parameters — think
            a motor whose friction coefficient creeps upward as it wears.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — RLS Online Line Fitting</span>
        <div className="content-block">
          <p>
            Click "Data point" to stream new noisy observations of slope 0.6.
            "Outlier" injects a bad reading. Watch how <InlineMath math="\lambda" /> controls
            how quickly the fit recovers and how strongly it weights recent data.
          </p>
          <RLSWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>Forgetting-Factor Cost</h3>
          <DisplayMath math="J_k(\mathbf{x}) = \sum_{i=1}^{k} \lambda^{k-i}\,\|y_i - \mathbf{h}_i^\top \mathbf{x}\|^2" />
          <p>Past observations contribute <InlineMath math="\lambda^{k-i}" />, decaying exponentially.</p>
          <h3>RLS Update (one step)</h3>
          <p>Given new pair <InlineMath math="(y_k, \mathbf{h}_k)" />:</p>
          <DisplayMath math="K_k = \frac{P_{k-1}\mathbf{h}_k}{\lambda + \mathbf{h}_k^\top P_{k-1}\mathbf{h}_k}" />
          <DisplayMath math="\hat{\mathbf{x}}_k = \hat{\mathbf{x}}_{k-1} + K_k\bigl(y_k - \mathbf{h}_k^\top\hat{\mathbf{x}}_{k-1}\bigr)" />
          <DisplayMath math="P_k = \frac{1}{\lambda}(I - K_k \mathbf{h}_k^\top)P_{k-1}" />
          <p>
            Each step: gain <InlineMath math="K_k" /> weights the innovation
            <InlineMath math="(y_k - \mathbf{h}_k^\top\hat{\mathbf{x}}_{k-1})" />; <InlineMath math="P_k" />
            shrinks (more certainty) but is inflated by <InlineMath math="1/\lambda" /> to account for
            possible parameter drift.
          </p>
          <h3>Connection to Kalman Filter</h3>
          <p>
            RLS is a special case of the Kalman filter with state model <InlineMath math="\mathbf{x}_k = \mathbf{x}_{k-1}" />
            (constant parameter) and <InlineMath math="Q = (1/\lambda - 1)P_{k-1}" />. The two
            algorithms share identical update equations.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>
            Scalar model <InlineMath math="y = hx + v" />. Init: <InlineMath math="\hat{x}_0 = 0, P_0 = 100" />,
            <InlineMath math="\lambda = 1" />. First observation: <InlineMath math="h_1 = 1, y_1 = 2" />.
          </p>
          <DisplayMath math="K_1 = \frac{100 \cdot 1}{1 + 1 \cdot 100 \cdot 1} = \frac{100}{101} \approx 0.990" />
          <DisplayMath math="\hat{x}_1 = 0 + 0.990(2 - 0) \approx 1.980" />
          <DisplayMath math="P_1 = (1 - 0.990 \cdot 1) \cdot 100 \approx 0.990" />
          <p>
            Second observation: <InlineMath math="h_2 = 1, y_2 = 1.6" />.
          </p>
          <DisplayMath math="K_2 = \frac{0.990}{1 + 0.990} \approx 0.497, \quad \hat{x}_2 = 1.980 + 0.497(1.6 - 1.980) \approx 1.791" />
          <p>Estimate converges toward the true parameter.</p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🦾</div>
              <h3>Payload Mass Identification</h3>
              <p>As a manipulator picks up an unknown object, RLS identifies the payload mass from joint torque measurements in real time, retuning the controller within milliseconds.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">⚙️</div>
              <h3>Motor Friction Estimation</h3>
              <p>Friction creeps as motors wear. With λ&lt;1, RLS tracks the slow drift in the friction model, keeping feedforward control accurate throughout the robot's lifetime.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📈</div>
              <h3>System Identification</h3>
              <p>When a robot's environment changes (new terrain, changing payload), RLS re-identifies dynamic model parameters online without stopping to collect a new batch dataset.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="Setting λ = 1 in RLS gives:"
            options={["Infinite memory (all data weighted equally)","Short memory (recent data only)","No update","Divergence"]}
            correct={0}
            explanation="λ=1 means λ^{k-i}=1 for all i — past observations are weighted equally, equivalent to batch least squares on the growing dataset." />
          <QuizQ num={2} type="mc"
            question="The RLS gain K_k → 0 when P_{k-1} → 0. This means:"
            options={["The estimator trusts its current estimate and barely updates","The estimator ignores all data","The system has diverged","The forgetting factor is too large"]}
            correct={0}
            explanation="Small P means high confidence. K→0 so the innovation has negligible effect — the estimator is already very certain." />
          <QuizQ num={3} type="mc"
            question="A forgetting factor λ = 0.9 gives an effective memory window of roughly:"
            options={["10 samples","100 samples","1 sample","∞ samples"]}
            correct={0}
            explanation="The effective window is 1/(1−λ) = 1/0.1 = 10 samples. Observations older than ~10 steps have negligible weight." />
          <QuizQ num={4} type="mc"
            question="RLS is equivalent to the Kalman filter with which state model?"
            options={["x_k = x_{k-1} (constant parameter)","x_k = Fx_{k-1} with known F","x_k = x_{k-1} + noise only","A nonlinear state model"]}
            correct={0}
            explanation="RLS assumes the parameter is constant (identity state transition), which is a Kalman filter with process noise Q = (1/λ−1)P_{k-1}." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — RLS cost: <InlineMath math="J_k = \sum_{i=1}^k \lambda^{k-i}\|y_i - h_i^\top x\|^2" /> — exponentially weighted past.</p>
          <p><strong>Day 1</strong> — Gain: <InlineMath math="K_k = P_{k-1}h_k/(\lambda + h_k^\top P_{k-1}h_k)" />; update: <InlineMath math="\hat{x}_k = \hat{x}_{k-1} + K_k(y_k - h_k^\top\hat{x}_{k-1})" />.</p>
          <p><strong>Day 3</strong> — Covariance update: <InlineMath math="P_k = (1/\lambda)(I - K_k h_k^\top)P_{k-1}" /> — the <InlineMath math="1/\lambda" /> inflation tracks drift.</p>
          <p><strong>Day 7</strong> — Effective window <InlineMath math="\approx 1/(1-\lambda)" /> samples; λ=1 → infinite memory, λ→0 → pure last-point estimate.</p>
          <p><strong>Day 14</strong> — RLS = Kalman filter with constant state model and <InlineMath math="Q = (1/\lambda - 1)P" />.</p>
        </div>
      </div>
    </div>
  )
}
