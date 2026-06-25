import { useState, useMemo, useCallback } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#fef0e7', color: '#922b21', borderColor: '#f5cba7' }
const W = 380, H = 220, N = 40

function rng(seed) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 16) / 65535 - 0.5 }
}

function simulate(Q, R, seed = 42) {
  const rand = rng(seed)
  let x = 0, P = 1
  const trueX = [], measY = [], kalmanX = [], bandP = []
  for (let k = 0; k < N; k++) {
    const procNoise = Math.sqrt(Q) * rand()
    const measNoise = Math.sqrt(R) * rand()
    x = 0.95 * x + procNoise
    const y = x + measNoise
    const xPred = 0.95 * (k === 0 ? 0 : kalmanX[k-1] ?? 0)
    const PPred = 0.95 * 0.95 * P + Q
    const K = PPred / (PPred + R)
    const xUpd = xPred + K * (y - xPred)
    P = (1 - K) * PPred
    trueX.push(x)
    measY.push(y)
    kalmanX.push(xUpd)
    bandP.push(P)
  }
  return { trueX, measY, kalmanX, bandP }
}

function KalmanWidget() {
  const [Q, setQ] = useState(0.1)
  const [R, setR] = useState(0.5)
  const [seed, setSeed] = useState(42)

  const { trueX, measY, kalmanX, bandP } = useMemo(() => simulate(Q, R, seed), [Q, R, seed])

  const yMin = -2.5, yMax = 2.5
  const toX = k => 30 + k * (W - 45) / (N - 1)
  const toY = y => H - 20 - ((y - yMin) / (yMax - yMin)) * (H - 35)

  const truePath = trueX.map((v, k) => `${k === 0 ? 'M' : 'L'}${toX(k)},${toY(v)}`).join(' ')
  const kfPath  = kalmanX.map((v, k) => `${k === 0 ? 'M' : 'L'}${toX(k)},${toY(v)}`).join(' ')

  const bandTop = kalmanX.map((v, k) => `${toX(k)},${toY(v + 2*Math.sqrt(bandP[k]))}`).join(' ')
  const bandBot = [...kalmanX].reverse().map((v, k) => `${toX(N-1-k)},${toY(v - 2*Math.sqrt(bandP[N-1-k]))}`).join(' ')

  const finalK = bandP[N-1] ? (bandP[N-1] / (bandP[N-1] + R)) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={W} height={H} style={{ background: '#fff9f5', borderRadius: 8, border: '1px solid #f5cba7' }}>
        <line x1={30} y1={H-20} x2={W-10} y2={H-20} stroke="#ddd" />
        <line x1={30} y1={10} x2={30} y2={H-20} stroke="#ddd" />
        <line x1={30} y1={toY(0)} x2={W-10} y2={toY(0)} stroke="#eee" strokeDasharray="3,3" />
        <polygon points={`${bandTop} ${bandBot}`} fill="#f5cba7" fillOpacity={0.5} />
        {measY.map((v, k) => <circle key={k} cx={toX(k)} cy={toY(v)} r={2.5} fill="#e67e22" fillOpacity={0.6} />)}
        <path d={truePath} fill="none" stroke="#2471a3" strokeWidth={2} strokeDasharray="5,3" />
        <path d={kfPath} fill="none" stroke="#922b21" strokeWidth={2.5} />
        <text x={36} y={18} fontSize={10} fill="#2471a3">— true state</text>
        <text x={36} y={30} fontSize={10} fill="#922b21">— Kalman estimate</text>
        <text x={36} y={42} fontSize={10} fill="#e67e22">● measurements</text>
        <text x={160} y={18} fontSize={10} fill="#c06030">shaded: ±2σ posterior</text>
      </svg>
      <div style={{ fontSize: 12, color: '#6e2e22', background: '#fef0e7', padding: '6px 16px', borderRadius: 6, border: '1px solid #f5cba7' }}>
        Steady-state gain K ≈ {fmt(finalK)} &nbsp;|&nbsp; Final P = {fmt(bandP[N-1])}
      </div>
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SliderRow label="Process noise Q" min={0.01} max={1} step={0.01} value={Q} onChange={setQ} />
        <SliderRow label="Sensor noise R" min={0.05} max={2} step={0.05} value={R} onChange={setR} />
      </div>
      <button onClick={() => setSeed(s => s + 1)} style={{ padding: '6px 18px', borderRadius: 6, background: '#922b21', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>
        New trajectory
      </button>
    </div>
  )
}

export default function L53() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>The Kalman Filter and EKF</h2>
        <div className="content-block">
          <p>
            A robot knows where it was and has a noisy sensor saying where it is now. How should
            it blend its prediction with its measurement? The answer, optimal for linear-Gaussian
            systems, is the <strong>Kalman filter</strong>.
          </p>
          <p>
            The filter alternates two steps: <em>predict</em> (push the state estimate forward
            through the dynamics, inflating uncertainty by process noise <InlineMath math="Q" />),
            and <em>update</em> (pull the estimate toward the measurement, deflating uncertainty
            by the information in the sensor). The Kalman gain <InlineMath math="K" /> is the
            optimal blend — it minimizes the posterior variance.
          </p>
          <p>
            For nonlinear dynamics <InlineMath math="\dot{\mathbf{x}} = f(\mathbf{x}, \mathbf{u}) + \mathbf{w}" />,
            the <strong>Extended Kalman Filter (EKF)</strong> linearizes around the current estimate
            using Jacobians <InlineMath math="F = \partial f/\partial x" /> and
            <InlineMath math="H = \partial h/\partial x" />, running the linear Kalman equations
            with time-varying matrices.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — Kalman Filter Tracking</span>
        <div className="content-block">
          <p>
            A scalar system <InlineMath math="x_{k+1} = 0.95 x_k + w_k" />, observed as
            <InlineMath math="y_k = x_k + v_k" />. Blue dashed = true state,
            orange dots = noisy measurements, red line = Kalman estimate, shaded = ±2σ posterior.
          </p>
          <KalmanWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>Linear Kalman Filter</h3>
          <p>System: <InlineMath math="\mathbf{x}_{k+1} = F\mathbf{x}_k + \mathbf{w}_k" />, <InlineMath math="\mathbf{y}_k = H\mathbf{x}_k + \mathbf{v}_k" />, <InlineMath math="\mathbf{w}_k \sim \mathcal{N}(\mathbf{0},Q)" />, <InlineMath math="\mathbf{v}_k \sim \mathcal{N}(\mathbf{0},R)" />.</p>
          <p><strong>Predict:</strong></p>
          <DisplayMath math="\hat{\mathbf{x}}_{k|k-1} = F\hat{\mathbf{x}}_{k-1|k-1}, \qquad P_{k|k-1} = FP_{k-1|k-1}F^\top + Q" />
          <p><strong>Update:</strong></p>
          <DisplayMath math="K_k = P_{k|k-1}H^\top(HP_{k|k-1}H^\top + R)^{-1}" />
          <DisplayMath math="\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + K_k(\mathbf{y}_k - H\hat{\mathbf{x}}_{k|k-1})" />
          <DisplayMath math="P_{k|k} = (I - K_kH)P_{k|k-1}" />
          <h3>Extended Kalman Filter (EKF)</h3>
          <p>Replace constant <InlineMath math="F, H" /> with time-varying Jacobians:</p>
          <DisplayMath math="F_k = \frac{\partial f}{\partial \mathbf{x}}\bigg|_{\hat{\mathbf{x}}_{k-1}}, \quad H_k = \frac{\partial h}{\partial \mathbf{x}}\bigg|_{\hat{\mathbf{x}}_{k|k-1}}" />
          <p>All other equations are identical to the linear filter. EKF is first-order accurate; the Unscented Kalman Filter (UKF) achieves second-order accuracy by propagating sigma points instead of linearizing.</p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>
            Scalar: <InlineMath math="F=1, H=1, Q=0.1, R=0.5" />. Prior: <InlineMath math="\hat{x}=0, P=1" />.
            Measurement: <InlineMath math="y = 1.3" />.
          </p>
          <p><strong>Predict:</strong> <InlineMath math="\hat{x}^- = 0, P^- = 1 + 0.1 = 1.1" /></p>
          <p><strong>Gain:</strong></p>
          <DisplayMath math="K = \frac{1.1}{1.1 + 0.5} = \frac{1.1}{1.6} = 0.6875" />
          <p><strong>Update:</strong></p>
          <DisplayMath math="\hat{x} = 0 + 0.6875(1.3 - 0) = 0.894" />
          <DisplayMath math="P = (1 - 0.6875) \cdot 1.1 = 0.344" />
          <p>
            The estimate (0.894) sits between prediction (0) and measurement (1.3),
            weighted by their relative uncertainties.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🚗</div>
              <h3>Autonomous Vehicle Localization</h3>
              <p>The Kalman filter fuses 100 Hz odometry predictions with 1 Hz GPS corrections, maintaining centimeter-level tracking between GPS updates.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🛸</div>
              <h3>Drone Attitude Estimation</h3>
              <p>The EKF fuses gyroscopes (high-rate, drifting) with accelerometers and magnetometers to estimate roll/pitch/yaw with Jacobians derived from the rotation kinematics.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🗺️</div>
              <h3>SLAM (EKF-SLAM)</h3>
              <p>Joint state = [robot pose; landmark positions]. The EKF maintains a large covariance matrix capturing correlations between robot and map uncertainty — the foundation of modern mapping.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="When sensor noise R → 0 (perfect sensor), the Kalman gain K approaches:"
            options={["H⁻¹ (trust the measurement completely)","0 (ignore the measurement)","1","P"]}
            correct={0}
            explanation="As R→0, K = PH^T(HPH^T+R)^{-1} → PH^T(HPH^T)^{-1} = H^{-T} (= H^{-1} when H is square). The filter trusts the measurement fully." />
          <QuizQ num={2} type="mc"
            question="Large process noise Q causes the Kalman filter to:"
            options={["Weight measurements more (higher gain)","Ignore measurements (lower gain)","Diverge","Run slower"]}
            correct={0}
            explanation="Large Q inflates P^-, making K larger, so the filter trusts new measurements more to compensate for unpredictable dynamics." />
          <QuizQ num={3} type="mc"
            question="The EKF differs from the linear Kalman filter by:"
            options={["Using Jacobians F_k, H_k that change at each step","Using nonlinear update equations","Eliminating the gain K","Running backwards in time"]}
            correct={0}
            explanation="EKF linearizes f and h around the current estimate at each step, producing time-varying matrices F_k = ∂f/∂x and H_k = ∂h/∂x." />
          <QuizQ num={4} type="mc"
            question="The innovation y_k − H x̂_{k|k-1} being consistently large suggests:"
            options={["Model mismatch or filter divergence","Good filter performance","Small process noise","Correct sensor calibration"]}
            correct={0}
            explanation="Innovations should be white noise with variance S = HP^-H^T + R. Consistently large innovations indicate the model or covariances are incorrect." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — Two-step loop: predict (<InlineMath math="P^- = FPF^\top + Q" />) then update (<InlineMath math="P = (I-KH)P^-" />).</p>
          <p><strong>Day 1</strong> — Kalman gain: <InlineMath math="K = P^-H^\top(HP^-H^\top+R)^{-1}" /> — balances process uncertainty and sensor noise.</p>
          <p><strong>Day 3</strong> — EKF: replace <InlineMath math="F, H" /> with Jacobians <InlineMath math="\partial f/\partial x, \partial h/\partial x" /> evaluated at current estimate.</p>
          <p><strong>Day 7</strong> — Large R → small K (trust prediction); large Q → large K (trust measurement).</p>
          <p><strong>Day 14</strong> — Innovation <InlineMath math="y_k - H\hat{x}^-" /> should be white Gaussian with covariance <InlineMath math="HP^-H^\top + R" /> — a diagnostic for filter health.</p>
        </div>
      </div>
    </div>
  )
}
