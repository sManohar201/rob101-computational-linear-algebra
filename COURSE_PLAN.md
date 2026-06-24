# ROB 101: Computational Linear Algebra — Interactive Course Plan

**Goal:** Teach the full course at MIT/Stanford depth with live Three.js 3D visualizations,
rigorous derivations, and robotics anchors at every step.

**Source material:** University of Michigan ROB 101, Fall 2021
**Instructor target:** Capable of delivering to Stanford / MIT undergraduate audiences

---

## COURSE ARCHITECTURE

6 modules, 24 lectures. Each lecture = one teaching session:
intuition → Three.js widget → formalism → derivation → robotics application → quiz.

**Build status:** `✅ L1` · `✅ L2` · `✅ L3` · `✅ L4` · `✅ L5` · `✅ L6` · `✅ L7` · `✅ L8` · `✅ L9` · `✅ L10` · `✅ L11` · `✅ L12` · `✅ L13` · `✅ L14` · `✅ L15` · `✅ L17` · `✅ L18` · `✅ L19` · `✅ L20` · `✅ L21` · `✅ L22` · `✅ L23` · only `L16` (recap) and `L24` (soft-margin/Gaussian SVM) remain stubs (`component: null` in
`src/data/curriculum.js`). See [PRODUCTION FORMAT](#production-format) for how lectures are
actually implemented and wired.

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
- **L16:** Full pipeline widget — input A and b, watch flow through LU → QR → solution *(stub)*

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
- **L24:** Kernel SVM — nonlinearly separable data in 2D lifted to 3D via feature map, then linearly separated *(stub)*

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
