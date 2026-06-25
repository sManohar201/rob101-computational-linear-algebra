import { useState, useMemo } from 'react'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'

const TAG = { background: '#fef0e7', color: '#922b21', borderColor: '#f5cba7' }
const W = 340, H = 280, CX = 170, CY = 140, SC = 60

function ellipsePoints(cov, n = 80) {
  const a = cov[0][0], b = cov[0][1], c = cov[1][1]
  const mid = (a + c) / 2
  const disc = Math.sqrt(((a - c) / 2) ** 2 + b * b)
  const l1 = mid + disc, l2 = Math.max(0, mid - disc)
  const theta = 0.5 * Math.atan2(2 * b, a - c)
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = (2 * Math.PI * i) / n
    const ex = Math.sqrt(l1) * Math.cos(t), ey = Math.sqrt(l2) * Math.sin(t)
    const x = ex * Math.cos(theta) - ey * Math.sin(theta)
    const y = ex * Math.sin(theta) + ey * Math.cos(theta)
    pts.push(`${CX + SC * x},${CY - SC * y}`)
  }
  return pts.join(' ')
}

function mat2mul(A, Sig) {
  const r = [[0,0],[0,0]]
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      for (let k = 0; k < 2; k++)
        r[i][j] += A[i][k] * Sig[k][j]
  return r
}
function mat2mulT(A, B) {
  const r = [[0,0],[0,0]]
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      for (let k = 0; k < 2; k++)
        r[i][j] += A[i][k] * B[j][k]
  return r
}

function GaussianTransformWidget() {
  const [a11, setA11] = useState(1.2)
  const [a12, setA12] = useState(0.5)
  const [a21, setA21] = useState(0.0)
  const [a22, setA22] = useState(0.8)
  const [rho, setRho] = useState(0.3)

  const { sigIn, sigOut } = useMemo(() => {
    const sigIn = [[1, rho], [rho, 1]]
    const A = [[a11, a12], [a21, a22]]
    const AS = mat2mul(A, sigIn)
    const sigOut = mat2mulT(AS, A)
    return { sigIn, sigOut }
  }, [a11, a12, a21, a22, rho])

  const ptsIn = ellipsePoints(sigIn)
  const ptsOut = ellipsePoints(sigOut)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width={W} height={H} style={{ background: '#fff9f5', borderRadius: 8, border: '1px solid #f5cba7' }}>
        <line x1={10} y1={CY} x2={W-10} y2={CY} stroke="#ddd" strokeWidth={1} />
        <line x1={CX} y1={10} x2={CX} y2={H-10} stroke="#ddd" strokeWidth={1} />
        <polyline points={ptsIn} fill="#aed6f1" fillOpacity={0.35} stroke="#2471a3" strokeWidth={2} />
        <polyline points={ptsOut} fill="#f5cba7" fillOpacity={0.4} stroke="#922b21" strokeWidth={2} />
        <text x={18} y={24} fontSize={11} fill="#2471a3">X (input)</text>
        <text x={18} y={38} fontSize={11} fill="#922b21">Y=AX (output)</text>
      </svg>
      <div style={{ fontSize: 12, color: '#6e2e22', background: '#fef0e7', padding: '6px 14px', borderRadius: 6, border: '1px solid #f5cba7', fontFamily: 'monospace' }}>
        Σ_Y = [{fmt(sigOut[0][0])}, {fmt(sigOut[0][1])}; {fmt(sigOut[1][0])}, {fmt(sigOut[1][1])}]
      </div>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 11, color: '#922b21', fontWeight: 600, marginBottom: 2 }}>
          A = [{fmt(a11)}, {fmt(a12)}; {fmt(a21)}, {fmt(a22)}]
        </div>
        <SliderRow label="A₁₁" min={-2} max={2} step={0.1} value={a11} onChange={setA11} />
        <SliderRow label="A₁₂" min={-2} max={2} step={0.1} value={a12} onChange={setA12} />
        <SliderRow label="A₂₁" min={-2} max={2} step={0.1} value={a21} onChange={setA21} />
        <SliderRow label="A₂₂" min={-2} max={2} step={0.1} value={a22} onChange={setA22} />
        <SliderRow label="ρ (input corr.)" min={-0.9} max={0.9} step={0.05} value={rho} onChange={setRho} />
      </div>
    </div>
  )
}

export default function L50() {
  return (
    <div className="lesson">
      <div className="lesson-section">
        <span className="section-tag intuition-tag" style={TAG}>Intuition</span>
        <h2>Multivariate Gaussian Distributions</h2>
        <div className="content-block">
          <p>
            A single Gaussian <InlineMath math="\mathcal{N}(\mu, \sigma^2)" /> is the bell curve
            you know from introductory stats. Extend to <InlineMath math="\mathbb{R}^n" /> and you
            get the <strong>multivariate Gaussian</strong>: a multi-dimensional bell whose shape is
            entirely encoded in the covariance matrix <InlineMath math="\Sigma" />.
          </p>
          <p>
            The magical property that makes Gaussians dominate engineering: <em>linear
            transformations map Gaussians to Gaussians</em>. If
            <InlineMath math="\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \Sigma)" />, then
            <InlineMath math="A\mathbf{x} \sim \mathcal{N}(A\boldsymbol{\mu}, A\Sigma A^\top)" />.
            This single rule powers the entire Kalman filter, PCA, and linear regression.
          </p>
          <p>
            The widget below shows this transformation live: the blue ellipse is the input covariance,
            the orange ellipse is the output covariance after multiplication by <InlineMath math="A" />.
          </p>
        </div>
      </div>

      <div className="lesson-section widget-section">
        <span className="section-tag widget-tag" style={TAG}>Widget — Gaussian Linear Transform</span>
        <div className="content-block">
          <p>
            Tune the 2×2 matrix <InlineMath math="A" /> and input correlation <InlineMath math="\rho" />.
            The output ellipse is <InlineMath math="\Sigma_Y = A\Sigma_X A^\top" />.
          </p>
          <GaussianTransformWidget />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag formalism-tag" style={TAG}>Formalism</span>
        <div className="content-block">
          <h3>Multivariate Gaussian PDF</h3>
          <DisplayMath math="\mathbf{x} \sim \mathcal{N}(\boldsymbol{\mu}, \Sigma):\quad p(\mathbf{x}) = \frac{1}{(2\pi)^{n/2}|\Sigma|^{1/2}} \exp\!\Bigl(-\tfrac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^\top \Sigma^{-1}(\mathbf{x}-\boldsymbol{\mu})\Bigr)" />
          <h3>Key Properties</h3>
          <ul>
            <li><strong>Marginalization:</strong> any subset of coordinates is itself Gaussian</li>
            <li><strong>Conditioning:</strong> <InlineMath math="p(\mathbf{x}_1 | \mathbf{x}_2)" /> is Gaussian with closed-form mean and covariance</li>
            <li><strong>Linear transform:</strong> if <InlineMath math="\mathbf{y} = A\mathbf{x} + \mathbf{b}" /> then <InlineMath math="\mathbf{y} \sim \mathcal{N}(A\boldsymbol{\mu}+\mathbf{b},\, A\Sigma A^\top)" /></li>
            <li><strong>Sum of independent Gaussians:</strong> <InlineMath math="\mathcal{N}(\mu_1,\Sigma_1) + \mathcal{N}(\mu_2,\Sigma_2) = \mathcal{N}(\mu_1+\mu_2, \Sigma_1+\Sigma_2)" /></li>
          </ul>
          <h3>Conditional Gaussian</h3>
          <p>Partition <InlineMath math="\mathbf{x} = [\mathbf{x}_1; \mathbf{x}_2]" /> with block covariance:</p>
          <DisplayMath math="\Sigma = \begin{bmatrix}\Sigma_{11} & \Sigma_{12}\\ \Sigma_{21} & \Sigma_{22}\end{bmatrix}" />
          <DisplayMath math="\mathbf{x}_1 | \mathbf{x}_2 \sim \mathcal{N}\!\left(\mu_1 + \Sigma_{12}\Sigma_{22}^{-1}(\mathbf{x}_2 - \mu_2),\; \Sigma_{11} - \Sigma_{12}\Sigma_{22}^{-1}\Sigma_{21}\right)" />
          <p>
            The term <InlineMath math="\Sigma_{11} - \Sigma_{12}\Sigma_{22}^{-1}\Sigma_{21}" /> is
            the <em>Schur complement</em> — the posterior covariance after conditioning.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag example-tag" style={TAG}>Worked Example</span>
        <div className="content-block">
          <p>
            Let <InlineMath math="\mathbf{x} \sim \mathcal{N}(\mathbf{0}, I)" /> and
            <InlineMath math="A = \begin{bmatrix}2 & 1 \\ 0 & 1\end{bmatrix}" />.
            Find the distribution of <InlineMath math="\mathbf{y} = A\mathbf{x}" />.
          </p>
          <p><strong>Mean:</strong> <InlineMath math="\boldsymbol{\mu}_y = A\mathbf{0} = \mathbf{0}" /></p>
          <p><strong>Covariance:</strong></p>
          <DisplayMath math="\Sigma_y = A I A^\top = AA^\top = \begin{bmatrix}2&1\\0&1\end{bmatrix}\begin{bmatrix}2&0\\1&1\end{bmatrix} = \begin{bmatrix}5&1\\1&1\end{bmatrix}" />
          <p>
            The circular unit covariance gets sheared into an ellipse with
            <InlineMath math="\lambda_1 \approx 5.83" />, <InlineMath math="\lambda_2 \approx 0.17" />,
            tilted slightly from the <InlineMath math="x_1" />-axis.
          </p>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag apps-tag" style={TAG}>Robotics Applications</span>
        <div className="content-block">
          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">🔭</div>
              <h3>Kalman Prediction Step</h3>
              <p>State evolves as x_{k+1} = F x_k + w. The predicted covariance is P_{k+1|k} = F P_k F^T + Q — pure Gaussian propagation through a linear map.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">📊</div>
              <h3>PCA / Whitening</h3>
              <p>PCA finds the matrix W that transforms data covariance to the identity: if Σ = V Λ V^T, then W = Λ^{-1/2} V^T whitens the data, making downstream algorithms scale-invariant.</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎯</div>
              <h3>Error Propagation</h3>
              <p>Camera intrinsic errors propagate through the projection Jacobian J to 3D point uncertainty via Σ_3D = J⁺ Σ_pixel (J⁺)^T, crucial for grasping reliability estimates.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag quiz-tag" style={TAG}>Quiz</span>
        <div className="content-block">
          <QuizQ num={1} type="mc"
            question="If x ~ N(μ, Σ) and y = Ax + b, what is the distribution of y?"
            options={["N(Aμ+b, AΣAᵀ)","N(Aμ, Σ)","N(μ+b, AΣ)","N(Aμ+b, AᵀΣA)"]}
            correct={0}
            explanation="Mean transforms as Aμ+b; covariance transforms as AΣAᵀ by the law of total covariance for linear maps." />
          <QuizQ num={2} type="mc"
            question="The marginal distribution of any coordinate subset of a multivariate Gaussian is:"
            options={["Gaussian","Uniform","Laplace","Exponential"]}
            correct={0}
            explanation="Marginalization is closed under the Gaussian family — any marginal is Gaussian with the corresponding sub-block of the mean and covariance." />
          <QuizQ num={3} type="mc"
            question="The Schur complement Σ₁₁ − Σ₁₂Σ₂₂⁻¹Σ₂₁ represents:"
            options={["The posterior covariance of x₁ given x₂","The marginal covariance of x₁","The joint covariance","The cross-covariance"]}
            correct={0}
            explanation="Conditioning on x₂ reduces uncertainty: the posterior covariance is the Schur complement, which is ≤ Σ₁₁ in the PSD order." />
          <QuizQ num={4} type="mc"
            question="For independent x₁~N(0,1) and x₂~N(0,4), the sum x₁+x₂ has variance:"
            options={["5","4","1","3"]}
            correct={0}
            explanation="Independence means covariance is zero, so Var(x₁+x₂) = Var(x₁) + Var(x₂) = 1 + 4 = 5." />
        </div>
      </div>

      <div className="lesson-section">
        <span className="section-tag review-tag" style={TAG}>Spaced Repetition</span>
        <div className="content-block">
          <p><strong>Day 0</strong> — PDF of <InlineMath math="\mathcal{N}(\boldsymbol{\mu},\Sigma)" /> — the Mahalanobis distance in the exponent, normalizer <InlineMath math="(2\pi)^{n/2}|\Sigma|^{1/2}" />.</p>
          <p><strong>Day 1</strong> — Linear transform rule: <InlineMath math="A\mathbf{x} \sim \mathcal{N}(A\boldsymbol{\mu}, A\Sigma A^\top)" />.</p>
          <p><strong>Day 3</strong> — Conditional mean: <InlineMath math="\mu_{1|2} = \mu_1 + \Sigma_{12}\Sigma_{22}^{-1}(\mathbf{x}_2 - \mu_2)" /> — the Wiener filter.</p>
          <p><strong>Day 7</strong> — Schur complement gives posterior covariance: <InlineMath math="\Sigma_{1|2} = \Sigma_{11} - \Sigma_{12}\Sigma_{22}^{-1}\Sigma_{21}" />.</p>
          <p><strong>Day 14</strong> — Sum of independent Gaussians: means add, covariances add.</p>
        </div>
      </div>
    </div>
  )
}
