# ROB 101: Computational Linear Algebra — Interactive Course Plan

**Goal:** Teach the full course at MIT/Stanford depth with live Three.js 3D visualizations,
rigorous derivations, and robotics anchors at every step.

**Source material:** University of Michigan ROB 101, Fall 2021
**Instructor target:** Capable of delivering to Stanford / MIT undergraduate audiences

---

## COURSE ARCHITECTURE

6 modules, 24 lectures. Each lecture = one teaching session:
intuition → Three.js widget → formalism → derivation → robotics application → quiz.

**Build status — Main course (24 lectures):**
`✅ L1` · `✅ L2` · `✅ L3` · `✅ L4` · `✅ L5` · `✅ L6` · `✅ L7` · `✅ L8` · `✅ L9` · `✅ L10` · `✅ L11` · `✅ L12` · `✅ L13` · `✅ L14` · `✅ L15` · `🔲 L16` · `✅ L17` · `✅ L18` · `✅ L19` · `✅ L20` · `✅ L21` · `✅ L22` · `✅ L23` · `🔲 L24`

`L16` (recap/concept-map) and `L24` (soft-margin/Gaussian SVM) are the only remaining stubs — both have full widget specs below. See [PRODUCTION FORMAT](#production-format) for how to wire a lecture.

**Build status — Appendices (3 bonus lessons):**
`🔲 LA` (SVD, complex eigenvalues, PD matrices) · `🔲 LB` (ODEs) · `🔲 LC` (Camera & LiDAR models) — all planned; see [APPENDICES](#appendices--supplementary-bonus-lessons) for full specs.

---

## MODULE 1 — Linear Systems & Matrix Machinery
*Lectures 1–6 | Aug 30 – Sep 22*

**The thread:** Every problem in robotics, ML, and physics reduces to solving **Ax = b**.
This module builds every tool needed to do that efficiently.

| Lec | Topic | Key Ideas | Robotics Anchor |
|-----|-------|-----------|-----------------|
| ✅ 1 | Why Computational Linear Algebra? | Systems of equations as the universal language of engineering | Robot arm: 3 joints, 3 angle constraints = 3 equations |
| ✅ 2 | Vectors, Matrices & Determinants | Scalars vs arrays; row/column vectors; rectangular vs square matrices; det as uniqueness test | Lidar scan = column vector of 360 range readings |
| ✅ 3 | Triangular Systems: Forward & Back Substitution | Structure as the key to tractability; det of triangular = product of diagonal | Chain of transforms in a kinematic chain = lower-triangular cascade |
| ✅ 4 | Matrix Multiplication | Row·column definition; size rules; permutation matrices; block views | Composing two rotation matrices = a single rotation |
| 5 | LU Factorization | Gaussian elimination encodes as L; solve Ly=b then Ux=y; PLU with pivoting | Real-time solver on embedded hardware (must be O(n²) after factoring once) |
| 6 | det(AB), Matrix Inverses & Transposes | det(AB)=det(A)det(B); inverse formula; why you almost never compute A⁻¹; Aᵀ | Pseudo-inverse appears in robot Jacobian control |

### Three.js Widgets — Module 1
- **L1** *(built, 3 widgets):* (a) quadratic discriminant — slide a,b,c, watch the two roots slide together and lift off the axis; (b) two lines, three outcomes — unique / parallel / identical; (c) three planes in 3D meeting at one point
- **L2** *(built, 3 widgets):* (a) System ⇄ Matrix assembler (DOM) — hover an equation to light its row of A, with inserted "missing-coefficient" zeros and a live det verdict; (b) determinant as signed **area** of the 2×2 column parallelogram; (c) determinant as signed **volume** of the 3×3 column parallelepiped
- **L3** *(built, 2 widgets):* (a) Forward/back substitution stepper (DOM) — step through lower/upper triangular presets one unknown at a time, active equation + pivot highlighted and the solution vector filling in, plus a singular zero-pivot case that fails at the offending row; (b) "why det = product of the diagonal" — the 3×3 lower-triangular column box whose volume is unchanged by below-diagonal shear and collapses to zero when a diagonal entry does
- **L4** *(built, 2 widgets):* (a) Matrix-multiply stepper (DOM) — step through each output entry of A·B with the i-th row of A and j-th column of B lit, the dot-product algebra shown live, the size rule [n×k]·[k×m] displayed, plus a size-mismatch preset that flags "undefined"; (b) matrix-as-transform — a 2×2 matrix acting on a draggable vector v, with the columns of A drawn as the images of e₁,e₂ and A·v = v₁col₁+v₂col₂ shown in red, presets for rotation/scaling/general
- **L5:** LU step-by-step — L fills green below diagonal, U fills red above, animated elimination
- **L6** *(built, 2 widgets):* (a) the 2×2 inverse lab (DOM) — slide a,b,c,d, watch det = ad−bc gatekeep the closed-form inverse and A·A⁻¹ snap to I, going "undefined" the instant det hits zero; (b) "A⁻¹ the hard way" stepper (DOM) — build A⁻¹ column by column by solving A·xᵢ = eᵢ, then see the actual Ax = b was a single solve all along, with a near-singular preset (Ex. 6.4) whose inverse explodes into entries ~10⁴ for a modest right-hand side

---

## MODULE 2 — Vector Spaces: The Deep Structure
*Lectures 7–16 | Sep 27 – Nov 1*

**The thread:** Individual vectors are points. Collections of vectors have *geometry*.
Understanding that geometry separates engineers who compute from engineers who understand.

| Lec | Topic | Key Ideas | Robotics Anchor |
|-----|-------|-----------|-----------------|
| ✅ 7 | Vector Space ℝⁿ Pt 1: Linear Combinations & Independence | n-tuples; span; linear independence; existence of Ax=b; LU/AᵀA test | Point cloud from depth camera = set of vectors in ℝ³; are they independent? |
| ✅ 8 | Counting Independent Vectors: the LDLᵀ Factorization | Ch. 7 §7.6: # independent columns = # non-zero diag(D); selecting independent columns via P; rank / dim span preview | How many independent directions a robot Jacobian / sensor suite truly has |
| ✅ 9 | Existence & Uniqueness of Solutions to Ax=b | Ch. 7 §7.7–7.8: Attractive Test (compare diag(D) vs diag(Dₑ)); none / unique / infinite via kₑ vs k vs m | Redundant manipulator: reachable pose, dependent columns ⇒ infinitely many joint solutions |
| ✅ 10 | Euclidean Norm, Least Squares & Linear Regression | ‖v‖₂; error vector e = Ax−b; minimize ‖e‖; normal equations AᵀAx=Aᵀb; regressor matrix Φ, fitting line & quadratic | Sensor fusion: overdetermined system, find best estimate |
| ✅ 11 | Vector Space ℝⁿ Pt 2: Subspaces | Ch. 9 §9.1–9.4: vector space axioms; subspace (closed under lin. comb., must contain 0); the three sources — null(A), span{S}, col span{A}; col span ⇔ solvability; rank/nullity preview | Robot workspace = range(J); null space = motions that don't move the end-effector |
| ✅ 12 | Dot Product & Orthonormal Vectors | Ch. 9 §9.5–9.7: inner product u·v=uᵀv; angle/orthogonality (u·v=0); norm; orthonormal sets; orthogonal⇒independent; orthogonal matrices QᵀQ=I, Q⁻¹=Qᵀ; Gram-Schmidt | IMU gyro axes must be orthonormal; misalignment = non-zero dot products |
| ✅ 13 | QR Factorization | Ch. 9 §9.8–9.10: A=QR via Gram-Schmidt; pipeline (factor, b̄=Qᵀb, back-sub Rx=b̄); least squares via QR (AᵀA=RᵀR); minimum-norm via QR of Aᵀ; underdetermined steering | Steering a mobile robot to the origin on minimum control effort; SLAM/Cassie use QR internally |
| ✅ 14 | Basis Vectors & Eigenvalues | Ch. 10 §10.2–10.3: basis = independent + spanning; coordinates/representation; det≠0 ⇔ basis of ℝⁿ; Av=λv; characteristic equation det(λI−A)=0; eigenbasis / complex pairs / symmetric⇒orthonormal; Aᵏx → dominant eigenvector | Principal axes of a rigid body = eigenvectors of inertia tensor; PCA; PageRank |
| ✅ 15 | Range, Null Space, Rank & Nullity | Ch. 10 §10.4–10.6: null(A), range = col span; solvability/uniqueness; general solution x=xₚ+null(A); rank/nullity; rank+nullity=m + proof sketch | Degrees of freedom of a robot = nullity of constraint matrix; range(J) = reachable workspace |
| 16 | Recap: Chapters 1–10 | Consolidation: linear systems → factorizations → vector spaces | Full pipeline: sensor data → solved state vector |

### Three.js Widgets — Module 2
- **L7** *(built, 2 widgets):* (a) Span visualizer — toggle 1/2/3 vectors and drag a probe vector v₃, watching the span grow line → plane → ℝ³, with a live independence verdict and `dim span` (rank) readout; a third vector that lies in the plane is flagged linearly dependent; (b) linear-combination reachability — slide α₁, α₂ to walk α₁u₁+α₂u₂ over the span plane and chase a target b, reachable **iff** b lies on the plane (built on Grizzle Ex. 7.4: solvable b=(0,−8,5) vs unreachable b=(4,4,4)). Covers Ch. 7: linear combinations, span, existence of Ax=b, linear independence, and the AᵀA / LDLT independence test
- **L8** *(built, 1 widget):* the independence counter — pick a set of vectors in ℝ³ (presets: 3 independent → ℝ³, 2 → a plane, a redundant 3rd, 4-in-ℝ³, all parallel), the HUD shows live `diag(D)` from the LDLᵀ factorization of `AᵀA` with non-zero pivots in green, the count `k` = number independent, and the span drawn (line/plane/box) with redundant vectors greyed out. Covers Ch. 7 §7.6: from yes/no independence to counting it, why symmetric LDLᵀ (not plain LU) counts reliably, identifying which columns are independent via the permutation; worked Ex. 7.11–7.13 (7×5 → `diag(D)=[15.6,5.2,4.4,2.3,0]`, k=4); previews rank / dim span
- **L9** *(built, 1 widget):* existence + uniqueness classifier — columns of `A` + a rose `b` in ℝ³, three presets (unique / none / infinite) with live independence counts of `A` vs `[A b]` and the verdict. Covers Ch. 7 §7.7–7.8: the Attractive Test for linear combinations (compare `diag(D)` vs `diag(Dₑ)`), the existence-and-uniqueness theorem and its three outcomes (none if `kₑ>k`, unique if `kₑ=k=m`, infinite if `kₑ=k<m`), uniqueness-from-independence proof (`Aα=0 ⇒ α=0`); worked Ex. 7.14–7.15; sets up least squares (L10) for the unreachable-`b` case
- **L10** *(built, 2 widgets):* (a) Least-squares line fit (Grizzle Ex. 8.1, Fig 8.1) — five non-collinear data points with sliders for slope/intercept, rose error bars eᵢ = yᵢ−(mxᵢ+b) and a live Σeᵢ² HUD, plus a ★ preset that snaps to the normal-equations optimum (m=2.12, b=2.33, ‖e‖²=4.456); (b) line-vs-parabola regression (Grizzle Ex. 8.2) — toggle the regressor matrix Φ between [x 1] and [1 x x²], auto-solving (ΦᵀΦ)α=ΦᵀY in JS to show the same machinery fits a curve, with det(ΦᵀΦ) and ‖e‖² readouts proving the quadratic wins. Covers Ch. 8: Euclidean norm + properties, e=Ax−b, minimize ‖Ax−b‖², normal equations, linear regression as fitting functions (linear in the coefficients)
- **L11** *(built, 2 widgets):* (a) "is this line a subspace?" — slide slope/intercept of `y = mx + b`; the origin dot turns red and the purple `v₁+v₂` sum falls off the line the instant `b ≠ 0`, visualizing the two subspace tests (contains 0, closed under +); built on Grizzle Ex. 9.1 / Fig 9.1; (b) the subspace **zoo** — a 3×3 matrix `A` with rank-3/2/1 presets drawing `col span{A}` (teal: ℝ³ → plane → line) and `null(A)` (purple: point → line → plane) simultaneously, HUD showing rank + nullity = 3. Covers Ch. 9 §9.1–9.4: subspace definition, easy first test, the three sources (null/span/col span), col span ⇔ solvability; worked Ex. 9.4 (null space) & 9.9 (column span); previews rank–nullity
- **L12** *(built, 2 widgets):* (a) dot product as an **angle meter** — two vectors set by angle+length sliders, HUD shows `u·v = ‖u‖‖v‖cosθ` and the angle, badge flips to "orthogonal" exactly at `u·v = 0`, orange projection (shadow) of v on u shown; presets incl. the book's (3,4)⟂(−7/3,7/4) pair; (b) **Gram-Schmidt** stepper — step through `vₖ = uₖ − Σ projⱼ`, grey input `uₖ`, orange shadow being subtracted, colored `vₖ` popping out ⟂ to the faint previous span (line/plane), then a normalize toggle to the orthonormal `qᵢ`; live `vᵢ·vⱼ = 0` check. Covers Ch. 9 §9.5–9.7: inner product, orthogonality, norm/normalize, orthonormal⇒independent, orthogonal matrices, Gram-Schmidt; worked Ex. 9.14 & 9.18
- **L13** *(built, 2 widgets):* (a) the **QR pipeline** solver (DOM) — pick `A,b`, step through factor `A = QR` (numeric Q,R), form `b̄ = Qᵀb`, back-substitute `Rx = b̄`; verified to reproduce Grizzle Ex. 9.20's `x = (−1,2,1)`; (b) **steering a mobile robot** (Grizzle §9.10) — `pₖ₊₁ = Apₖ + Buₖ`; the zero-control preset spirals outward like a Roomba, the steer presets solve the underdetermined `Muₛₑ𝓆 = pₙ − Sp₀` for the **minimum-norm** control and glide to the origin, HUD shows control effort `‖u‖²` (verified 10.26 at N=20 vs 200.5 at N=1, matching the book). Covers Ch. 9 §9.8–9.10: QR factorization, the suggested pipeline, least squares via QR (`AᵀA = RᵀR`), minimum-norm/underdetermined solutions; worked Ex. 9.19–9.22
- **L14** *(built, 2 widgets):* (a) the **eigenvector finder** — sweep an input vector v(θ) and watch its image Av swing off-axis (orange) until it snaps back onto a faint dashed **eigen-line** (Av = λv); presets for distinct-real / symmetric (orthogonal eigvecs) / shear / pure-rotation (complex, badge flips to "every vector rotates") / contraction+growth, with snap-to-v₁/v₂ buttons and a live tr/det/λ HUD; (b) **power iteration** (DOM) — normalised Aᵏx with a converging angle column showing the direction locking onto the dominant eigenvector (green when converged), complex preset never converging. Covers Ch. 10 §10.2–10.3: basis/coordinates/dimension, det≠0⇔basis, characteristic equation, eigenbasis/complex/symmetric facts, Aᵏx → dominant eigenvector (PageRank/PCA)
- **L15** *(built, 2 widgets):* (a) **solution set = xₚ + null(A)** — null(A) drawn through the origin (purple line/plane) and the parallel teal solution set through xₚ; slide along the null direction(s) and A·x stays pinned at b; presets for rank-2/nullity-1 (line), rank-1/nullity-2 (plane), unique point, and b∉range (no solution), with a rank+nullity=m HUD; (b) the **rank–nullity ledger** (DOM) — a table over square and non-square shapes (incl. the 7×5 Grizzle example) verifying rank+nullity=m every time. Covers Ch. 10 §10.4–10.6: null/range, existence/uniqueness, general solution, rank–nullity theorem + proof sketch
- **L16** *(2 widgets — stub, build next):* (a) **"Algorithm zoo" comparison** (DOM) — a side-by-side table of the four factorizations (LU, LDLᵀ, QR, Normal Equations): use case / operation count / numerical stability / what it reveals about A; below the table, a 3×3 matrix picker (presets: well-conditioned / ill-conditioned / symmetric PD / rank-deficient) steps through whichever algorithm is selected to solve Ax=b, with each step annotated; a "which algorithm wins?" verdict panel at the bottom; (b) **"Every concept on one diagram"** — a Three.js force-graph whose nodes are the 10 chapter concepts (Linear System · LU · Determinant · Rank · Null Space · QR · Eigenvalues · Least Squares · Subspaces · Optimization) and whose edges encode dependency ("LU enables → Determinant", "Rank + Null Space → Rank–Nullity theorem", etc.); click any node to highlight its path back to Ax=b and show the lecture(s) that introduced it; orbit + zoom to explore. Covers: consolidation of Grizzle Chs. 1–10; maps to the checkpoint "Recap — every concept so far on one diagram."
  - **To build L16:** create `src/lessons/m2/L16.jsx`, follow the 6-section structure; wire it in `curriculum.js` (`import L16 from '../lessons/m2/L16.jsx'`, set `component: L16`). The DOM widget (a) needs no Three.js — use plain React state + CSS grid. Widget (b) uses Three.js `SphereGeometry` nodes + `TubeGeometry` edges; store graph data as a static JS array of `{id, label, links:[]}` objects.

---

## MODULE 3 — Nonlinear Methods & Optimization
*Lectures 17–21 | Nov 3 – Nov 17*

**The thread:** The real world is nonlinear. But linear algebra gives us the tools to
*linearize* nonlinear problems and iterate to solutions.

| Lec | Topic | Key Ideas | Robotics Anchor |
|-----|-------|-----------|-----------------|
| ✅ 17 | Bisection & Newton's Method (scalar) | Ch. 11 §11.1–11.4: root finding f(x)=0; IVT bracket + bisection; forward/backward/symmetric finite differences; Newton xₖ₊₁=xₖ−f/f′ + damping; quadratic vs linear convergence | Joint angle satisfying a reach constraint |
| ✅ 18 | Vector-valued Functions: Gradient & Jacobian | Ch. 11 §11.5: partials; gradient ∇f (row); Jacobian (n×m); linear approximations f(x)≈f(x₀)+J(x−x₀); det J = ℓ₁ℓ₂ sin θ₂ singularity | Robot forward kinematics: J maps joint velocities → Cartesian velocities |
| ✅ 19 | Newton-Raphson for Vector Functions | Ch. 11 §11.6: solve J·Δx = −f(x) (no inverse), x←x+Δx, damped variant; quadratic convergence | Inverse kinematics: find joint angles given end-effector position |
| ✅ 20 | Optimization: First-Order (Gradient Descent) | Ch. 12 §12.1–12.4: cost f; ∇f steepest-ascent, ∇f=0 at extrema; x←x−s[∇f]ᵀ; step-size stability s<2/λₘₐₓ, condition number; calibration case study | Training a neural network; path planning cost minimization; LiDAR-camera calibration |
| ✅ 21 | Optimization: Second-Order Unconstrained | Ch. 12 §12.5–12.9: Hessian (symmetric); Newton min ∇²f·Δx=−[∇f]ᵀ; definiteness (min/max/saddle); convexity ⇒ global min; QP preview; 400× speed-up | Faster IK; optimal control / MPC |

### Three.js Widgets — Module 3
- **L17** *(built, 2 widgets):* (a) **Newton on a curve** — step through xₖ₊₁=xₖ−f/f′ with the tangent line walking the guess onto the teal true root; presets x²−2 (√2) / x³−2x−5 / cos x−x, live error readout; (b) **bisection vs Newton race** (DOM) — side-by-side iteration tables solving x²−2, bisection halving (~34 steps to 1e-10) vs Newton squaring the error (~5 steps). Covers Ch. 11 §11.1–11.4: IVT/bracket, bisection, finite differences, Newton + damping, convergence orders
- **L18** *(built, 2 widgets):* (a) the **arm Jacobian** — a 2-link planar arm with joint sliders; the two Jacobian columns drawn as hand-velocity arrows (red = joint 1, blue = joint 2); when the arm straightens (θ₂→0) the columns align and det J = ℓ₁ℓ₂ sin θ₂ → 0, firing a "near singular" badge; (b) the **gradient as a linear forecaster** (DOM) — on the bowl x²+2y², step away from x₀ and compare true f vs the gradient's linear prediction, error growing with distance. Covers Ch. 11 §11.5: partials, gradient, Jacobian, linear approximation, singularities
- **L19** *(built, 2 widgets):* (a) **Newton-Raphson IK** — pick a target, step through solving J·Δθ=−(f(θ)−target); the arm homes in with a fading trail of past hand positions and a residual readout; (b) **quadratic-convergence ledger** (DOM) — per-iteration θ and residual ‖f(θₖ)‖ collapsing (≈ squaring) to <1e-9 in ~5 steps. Covers Ch. 11 §11.6: J·Δx=−f solve, damping, inverse kinematics, singular ill-conditioning
- **L20** *(built, 2 widgets):* (a) **rolling downhill** — a real 3D loss surface (round bowl / narrow ill-conditioned valley / tilted bowl) with a gradient-descent path; scrub the learning rate to watch it crawl, zig-zag, or overshoot and diverge (badge); (b) the **step-size cliff** (DOM) — sweep s on the narrow valley showing the sharp boundary at s=2/λₘₐₓ=0.25 between convergence and blow-up. Covers Ch. 12 §12.1–12.4: cost, gradient facts, descent update, step-size stability/condition number, calibration case study
- **L21** *(built, 2 widgets):* (a) **gradient descent vs Newton** on the same 3D surface — orange GD zig-zag against blue Newton's straight shot (one step to the minimum of a quadratic) with a step-count speed-up HUD; (b) the **curvature test** (DOM) — Hessian eigenvalues classifying critical points as min (pos-def) / max (neg-def) / saddle (indefinite). Covers Ch. 12 §12.5–12.9: Hessian, Newton minimization ∇²f·Δx=−[∇f]ᵀ, definiteness, convexity, QP/least-squares-as-QP preview

---

## MODULE 4 — Geometry, Hyperplanes & Machine Learning
*Lectures 22–24 | Nov 22 – Dec 1*

**The thread:** Linear algebra doesn't just solve equations — it *separates* and *classifies* the world.
This is the foundation of modern ML.

| Lec | Topic | Key Ideas | Robotics Anchor |
|-----|-------|-----------|-----------------|
| ✅ 22 | Affine Spaces & Hyperplanes | Ch. 13 §13.1–13.2, §13.4: hyper-subspace = null(aᵀ); hyperplane H=xc+N; half-spaces H⁺/H⁻; signed distance a·(x−xc)/‖a‖; orthogonal projection theorem, Gram matrix, normal equations = least squares | Collision detection: is a point on the safe side of a boundary? |
| ✅ 23 | Hyperplanes in ℝⁿ, QP & Max-Margin Classifier | Ch. 13 §13.3 + Ch. 12 §12.8: signed-distance score; margin 2/‖a‖; support vectors; hard-margin SVM as QP min ½‖w‖² s.t. ℓᵢ(wᵀx̃ᵢ)≥1; QP standard form; least squares as QP (Q=2AᵀA, q=−2Aᵀb) | Terrain classification for a walking robot |
| 24 | Soft Margin & Gaussian SVM | Slack variables; kernel trick; Gaussian RBF kernel; nonlinear decision boundary | Obstacle classification from lidar with non-separable point clouds |

### Three.js Widgets — Module 4
- **L22** *(built, 2 widgets):* (a) **hyperplane & signed distance** — a tilted plane with its normal a in ℝ³; drag a query point across it and watch the signed distance a·(x−xc)/‖a‖ flip sign between H⁺ (teal) and H⁻ (rose), foot-of-perpendicular drawn; (b) **orthogonal projection** — project x₀ onto a plane V=span{v₁,v₂}; the rose error x₀−x* stays ⟂ V with a live Pythagorean check ‖x₀‖²=‖x*‖²+‖e‖², tying projection to the least-squares normal equations. Covers Ch. 13 §13.1–13.2, §13.4: hyper-subspace/hyperplane, half-spaces, signed distance, projection theorem, Gram matrix
- **L23** *(built, 2 widgets):* (a) the **max-margin classifier** — two labelled 2D clouds; rotate/shift the boundary and read the margin (smallest gap), then ★ snap-to-optimum (brute-force max-min over orientation) marks the support vectors (white-dotted) and flips the badge to "max-margin solution (SVM)"; non-separating orientations flagged; (b) the **QP behind the margin** (DOM) — the hard-margin QP min ½‖w‖² s.t. ℓᵢ(wᵀx̃ᵢ)≥1, the OSQP standard form, and least-squares-as-QP (Q=2AᵀA, q=−2Aᵀb). Covers Ch. 13 §13.3 + Ch. 12 §12.8
- **L24** *(2 widgets — stub, build next):* (a) **Kernel lift** — two non-separable 2D point clouds (XOR / interlocking crescents preset) lifted to 3D via a Gaussian RBF feature map φ(x)=exp(−γ‖x−cᵢ‖²); a flat separating hyperplane is drawn in 3D feature space and its pre-image curved boundary shown in 2D; sweep γ (bandwidth slider) to morph from near-linear (γ small, underfitting) to hyper-local (γ large, overfitting) with a live test-accuracy HUD; presets: XOR / crescents / linearly separable (sanity check); (b) **Soft-margin tradeoff** (DOM) — the QP min ½‖w‖²+CΣξᵢ s.t. ℓᵢ(wᵀx̃ᵢ)≥1−ξᵢ, ξᵢ≥0; sliders for C (regularization strength) and γ; live readouts: margin width 2/‖w‖, # support vectors, # margin violations, train and test accuracy; the "C→∞ hard-margin on non-separable data" preset marks the QP infeasible with a red badge. Covers Grizzle Ch. 13 + slack variables + kernel trick; consolidation checkpoint "The entire course in one ML pipeline."
  - **To build L24:** create `src/lessons/m4/L24.jsx`, wire it in `curriculum.js`. Widget (a): implement the Gaussian RBF lift as a plain JS function, project the lifted points with `SphereGeometry`, draw the 3D hyperplane with `PlaneGeometry`. Widget (b) is a DOM widget — implement a simple quadratic solver (gradient-descent on the dual, or a small hard-coded OSQP-style solver) so the margin and slacks update in real time.

---

## APPENDICES — Supplementary Bonus Lessons

*Source: Grizzle Appendices A, B, C*

These are optional bonus lessons that extend the 24-lecture core into advanced topics.
Build them as `src/lessons/appendix/LA.jsx`, `LB.jsx`, `LC.jsx` and add a new module block
in `curriculum.js`:

```js
import LA from '../lessons/appendix/LA.jsx'
import LB from '../lessons/appendix/LB.jsx'
import LC from '../lessons/appendix/LC.jsx'

{
  id: 'appendix', title: 'Appendix', subtitle: 'Beyond the Core', color: '#f08c00',
  thread: 'Deeper tools for the curious engineer.',
  lectures: [
    { id: 'lA', num: 'A', title: 'SVD, Complex Eigenvalues & Positive Definite Matrices', component: LA },
    { id: 'lB', num: 'B', title: 'Ordinary Differential Equations',                       component: LB },
    { id: 'lC', num: 'C', title: 'Camera & LiDAR Models',                                 component: LC },
  ],
}
```

---

### Appendix A — Cool Things Omitted from the Main Course
*Source: Grizzle Appendix A*

| Topic | Key Ideas | Robotics Anchor |
|-------|-----------|-----------------|
| A.1 Complex Numbers & Vectors | ℂ; polar form ρe^{iθ}; Euler's formula; zₖ₊₁=azₖ — spiral/decay/rotate by |a| and ∠a | Eigenvalues of a 2D rotation matrix are e^{±iθ}; stability of discrete-time control loops |
| A.2 Eigenvalues (deep) | Algebraic vs geometric multiplicity; complex conjugate pairs; spectral decomposition A=QΛQᵀ for symmetric A | PCA of a robot sensor covariance matrix; A⁻¹=QΛ⁻¹Qᵀ for free |
| A.3 Positive Definite Matrices | Quadratic form xᵀPx; PD iff all λᵢ>0; LDLᵀ and LU tests; Schur complement theorem | Lyapunov stability: V(x)=xᵀPx>0 proves a control law makes a robot converge |
| A.4 Singular Value Decomposition | A=UΣVᵀ; σᵢ = effective rank gauge; rank-one expansion; numerical independence threshold δ | Robot manipulability ellipsoid; image compression (keep top-r singular values) |
| A.5 Linear & Affine Transformations | L:ℝᵐ→ℝⁿ as matrix; differentiation on polynomials as matrix multiply; f(x)=Ax+b | Real-time signal differentiation on embedded hardware via matrix-vector multiply |

#### Three.js Widgets — Appendix A

- **A.1** *(1 widget):* **complex spiral** — the discrete-time system zₖ₊₁=azₖ animated in the complex plane; drag the pole `a` by its magnitude |a| and angle ∠a and watch the trajectory spiral inward (|a|<1, stable), outward (|a|>1, unstable), or orbit the unit circle (|a|=1); a second panel shows the real-plane trajectory of Aᵏv for the equivalent 2×2 real rotation-scaling matrix. Covers §A.1: ℂ, Euler's formula, difference equations, pole ↔ eigenvalue

- **A.2** *(1 widget):* **spectral decomposition lab** — a 2×2 symmetric matrix A dialed via sliders (a,b,d in [[a,b],[b,d]]); eigenvectors v₁,v₂ drawn as orthogonal orange/blue arrows rotating live; the quadratic-form ellipse xᵀAx=1 in teal; the rank-one sum λ₁v₁v₁ᵀ+λ₂v₂v₂ᵀ shown rebuilding A with a "terms revealed" toggle. Covers §A.2: symmetric eigenstuff, A=QΛQᵀ, A⁻¹=QΛ⁻¹Qᵀ

- **A.3** *(1 widget):* **PD bowl** — the surface z=xᵀPx for a 2×2 symmetric P; slide the two eigenvalues λ₁,λ₂ and watch the bowl warp: both positive → upward bowl (PD), one zero → trough (PSD), one negative → saddle (indefinite), both negative → downward bowl; LDLᵀ diag(D) shown live as the definiteness test. Covers §A.3: quadratic forms, PD/PSD/indefinite, LDLᵀ test, Schur complement

- **A.4** *(2 widgets):* (a) **SVD as three operations** — a 2×2 matrix A=UΣVᵀ applied to the unit circle (shown as 32 probe vectors); animated in three stages: rotate by Vᵀ (purple), scale by Σ (teal → ellipse), rotate by U (orange); σ₁,σ₂ labels on the ellipse axes; (b) **rank-one reconstruction** (DOM) — a 5×4 numerical matrix reconstructed as Σᵢσᵢuᵢvᵢᵀ; a rank slider from 1 to 4 shows each term contributing and the Frobenius error falling. Covers §A.4: SVD theorem, geometric meaning, rank/nullity from singular values, low-rank approximation

- **A.5** *(1 widget):* **differentiation matrix** (DOM) — pick polynomial degree n (2–5); display the (n+1)×(n+1) differentiation matrix A; input coefficient vector [a₀…aₙ] and watch A·[x]ᵥ produce the derivative coefficients; verify against symbolic d/dt alongside. Covers §A.5: linear transformations as matrices, polynomial basis, affine maps f(x)=Ax+b

---

### Appendix B — Ordinary Differential Equations
*Source: Grizzle Appendix B*

| Topic | Key Ideas | Robotics Anchor |
|-------|-----------|-----------------|
| B.1–B.3 Discrete vs Continuous Time | Difference equations; x[k+1]=x[k]+δt·f(x[k]); choosing δt for stability | Embedded control loop at 1 kHz: δt=0.001 s |
| B.4 Modeling Physical Systems | F=ma as an ODE; drag model; discretizing the derivative (forward difference) | Simulating a falling drone with air resistance |
| B.5 Nonlinear ODEs | Vector ODE dx/dt=Ax+b; nonlinear pendulum θ̈+(g/ℓ)sinθ=0; symmetric difference | Robot arm joint dynamics; why small δt matters near nonlinear regions |

#### Three.js Widgets — Appendix B

- **B.1–B.5** *(2 widgets):* (a) **Forward Euler phase portrait** — 2D state space (position x₁, velocity x₂) for dx/dt=Ax; drag the initial condition dot and watch the Euler trajectory trace out spirals/sinks/sources depending on eigenvalues of A; δt slider reveals the stability boundary — too large and Euler diverges even when the true ODE is stable; presets: stable spiral / unstable node / center; (b) **nonlinear pendulum** — simulate θ̈+(g/ℓ)sinθ=0 via Forward Euler with adjustable δt and initial angle θ₀; the phase portrait (θ, θ̇) animates in real time; toggle the linearized ODE (sinθ≈θ) alongside to see when they diverge. Covers §B.1–B.5: static vs dynamic equations, discrete time, forward difference, Euler integration, linear vector ODE, nonlinear pendulum

---

### Appendix C — Camera and LiDAR Models
*Source: Grizzle Appendix C*

| Topic | Key Ideas | Robotics Anchor |
|-------|-----------|-----------------|
| C.1–C.2 Pinhole Camera & Homogeneous Coords | Intrinsic K / extrinsic [R t]; homogeneous ↔ Cartesian; T·R·S composition | A camera's full projection pipeline is three matrix multiplies |
| C.3–C.4 Perspective Projection | x=fX/Z; u=K[I 0][R t]X_w pipeline; focal length, principal point, pixel skew | Mapping a 3D robot endpoint to the 2D pixel where it appears |
| C.5–C.6 Calibration & Distortion | Least squares to solve for K; radial/tangential distortion; Newton-Raphson to undistort | Calibrating a drone's downward camera from a planar checkerboard |
| C.7–C.8 LiDAR-to-Camera Fusion | Π(Xᵢ;R,t):=Yᵢ projection map; rigid-body transform H^C_L; overlay point cloud on image | Fusing LiDAR depth with RGB image for obstacle detection |

#### Three.js Widgets — Appendix C

- **C.1–C.4** *(1 widget):* **camera projection pipeline** — a 3D scene with a movable point P=(X,Y,Z) and a virtual camera (frustum drawn in grey); sliders for focal length f, yaw/pitch rotation R, and translation t; an orange ray traces from P through the image plane to the projected pixel; the full matrix computation K[I 0][R t][X;1] shown live in a HUD breaking out each matrix stage. Covers §C.1–C.4: pinhole model, homogeneous coordinates, extrinsic + intrinsic matrices, perspective projection

- **C.5–C.8** *(1 widget):* **LiDAR-to-camera overlay** — a synthetic 3D point cloud (cuboid obstacle) transformed by a 6-DOF extrinsic H^C_L and projected onto a 2D image plane drawn beside the 3D view; sliders for x/y/z/roll/pitch/yaw; a "calibrate" button generates N=6 known 3D↔2D correspondences and solves for the 5 intrinsic parameters in K via least squares, displaying the residual ‖Ax−b‖² before and after. Covers §C.5–C.8: camera calibration, distortion types, LiDAR-camera projection map, least squares as a real sensor fusion tool

---

## PEDAGOGY RULES

**Every session follows this exact structure:**
```
1. INTUITION      — physical analogy, no equations, builds gut feeling
2. THREE.JS WIDGET — built and explained before any formalism
3. FORMALISM      — rigorous notation, full derivation, every algebra step shown
4. WORKED EXAMPLE — numerical example tied back to widget geometry
5. APPLICATION    — concrete robotics/ML system the concept appears in
6. QUIZ           — geometric question + computational question + transfer question
```

**Consolidation checkpoints:**
- After L6:  "You can now solve Ax=b. Here's what that took."
- After L13: "You now have four algorithms for Ax=b. Here's why QR wins."
- After L16: "Recap — every concept so far on one diagram."
- After L21: "Linear algebra solves linear problems. Linearization solves everything else."
- After L24: "The entire course in one ML pipeline."

**Color vocabulary (consistent across ALL widgets).** The widgets render on a **light**
canvas, so the palette uses saturated, darker tones for contrast (pale/neon washes out).
Source of truth: `COL` in `src/lessons/shared/three-helpers.js` (3D scene) and the CSS
custom properties in `:root` of `src/app.css` (prose/HUD).

| Role | 3D hex (`COL`) | Meaning |
|------|----------------|---------|
| x-axis | `#e03131` | primary quantity |
| y-axis | `#2f9e44` | secondary quantity |
| z-axis | `#1971c2` | tertiary quantity |
| line1 / plane1 | `#e8590c` | first line or plane (orange) |
| line2 / plane2 | `#1c7ed6` | second line or plane (blue) |
| line3 / plane3 | `#c2255c` | third plane (rose) |
| point | `#099268` | solution / intersection (teal) |
| vertex | `#6741d9` | secondary marker (purple) |
| guide | `#5c6b85` | faint guide / reference lines |
| position vector | `#b5740a` | highlighted vector (amber) |

**Widget must-haves (every widget):**
1. Orbit controls — drag to orbit, scroll to zoom (manual, no library; see `useOrbitScene.js`)
2. Live HUD — key quantities update in real time
3. Preset buttons — 3–5 named configurations
4. Sliders — direct parameter control
5. **Light theme** — vertical-gradient background `#f4f8fd → #dde7f4` (the surrounding app/sidebar is the dark frame)
6. Canvas sprite labels for all math symbols
7. Smooth parameter easing on preset changes (`useAnimatedParams.js`) so geometry glides instead of snapping

---

## PRODUCTION FORMAT

The course is a **React + Vite single-page app** (not standalone HTML files). Three.js,
React, and KaTeX come from npm and are bundled by Vite. Actual layout:

```
course/
  index.html                  # Vite entry
  package.json · vite.config.js
  src/
    main.jsx · App.jsx · app.css
    components/
      Sidebar.jsx             # module/lecture nav
      LessonView.jsx          # renders the active lecture (or a stub)
      Math.jsx                # InlineMath / DisplayMath (KaTeX)
    data/
      curriculum.js           # THE registry: maps each lecture id → its component
    lessons/
      m1/L01.jsx  m1/L02.jsx  # one file per built lecture (others not yet created)
      shared/                 # reused across every lecture:
        three-helpers.js      #   COL palette, tube/sphere/arrow/parallelogram/…, disposeObject
        useOrbitScene.js      #   renderer + camera + manual orbit + render loop
        useAnimatedParams.js  #   smooth easing of widget params on preset change
        linalg.js             #   solveLinear, classify, det2, det3
        ui.jsx                #   fmt/lead/term, SliderRow, QuizQ
  COURSE_PLAN.md
```

**To add a lecture:** create `src/lessons/mN/LXX.jsx` (follow the section order in
[PEDAGOGY RULES](#pedagogy-rules)), then **wire it in** `src/data/curriculum.js` —
`import LXX from '../lessons/mN/LXX.jsx'` and set that lecture's `component: LXX`.
Until wired, a lecture's `component` is `null` and `LessonView` shows a "coming soon" stub.
Verify with `npm run build` (or `npm run dev`) from `course/`.

Each lecture component contains:
- Its Three.js widget(s) — split-screen canvas + HUD + presets + sliders — or a DOM widget where that teaches better (e.g. L2's System ⇄ Matrix assembler)
- Derivation text and worked examples rendered alongside (KaTeX)
- A robotics/ML applications grid, a self-grading quiz, and a spaced-repetition schedule

---

## SPACED REPETITION (end of every session)

```
Day 0  — Re-derive [key result] from scratch without notes
Day 1  — Answer: [2-question self-quiz]
Day 3  — Redo [worked example] without notes
Day 7  — Answer: [cross-topic connection question]
Day 14 — Explain [core concept] to someone else in under 2 minutes
```
