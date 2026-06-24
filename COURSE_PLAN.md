# ROB 101: Computational Linear Algebra — Interactive Course Plan

**Goal:** Teach the full course at MIT/Stanford depth with live Three.js 3D visualizations,
rigorous derivations, and robotics anchors at every step.

**Source material:** University of Michigan ROB 101, Fall 2021
**Instructor target:** Capable of delivering to Stanford / MIT undergraduate audiences

---

## COURSE ARCHITECTURE

6 modules, 24 lectures. Each lecture = one teaching session:
intuition → Three.js widget → formalism → derivation → robotics application → quiz.

**Build status:** `✅ L1` · `✅ L2` · `✅ L3` · `✅ L4` · `✅ L5` · `✅ L6` · `✅ L7` · remaining lectures are stubs (`component: null` in
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
| ✅ 7 · (8–9) | Vector Space ℝⁿ Pt 1: Linear Combinations & Independence | n-tuples; span; linear independence; LU test; LDLT | Point cloud from depth camera = set of vectors in ℝ³; are they independent? |
| 10 | Euclidean Norm, Least Squares & Linear Regression | ‖v‖₂; error vector e = Ax−b; minimize ‖e‖; normal equations AᵀAx=Aᵀb | Sensor fusion: overdetermined system, find best estimate |
| 11 | Vector Space ℝⁿ Pt 2: Subspaces | Vector space axioms; subspace; span; range, column span, null space of A | Robot workspace = range(J); null space = motions that don't move the end-effector |
| 12 | Dot Product & Orthonormal Vectors | Inner product; angle between vectors; orthogonality; Gram-Schmidt | IMU gyro axes must be orthonormal; misalignment = non-zero dot products |
| 13 | QR Factorization | Q (orthogonal), R (upper triangular); most numerically stable solver; recommended pipeline | Real-time SLAM state estimation uses QR internally |
| 14 | Basis Vectors & Eigenvalues | Coordinates in a basis; dimension; Av=λv; diagonalization | Principal axes of a rigid body = eigenvectors of inertia tensor |
| 15 | Range, Null Space, Rank & Nullity | Rank-nullity theorem; four fundamental subspaces; row space | Degrees of freedom of a robot = nullity of constraint matrix |
| 16 | Recap: Chapters 1–10 | Consolidation: linear systems → factorizations → vector spaces | Full pipeline: sensor data → solved state vector |

### Three.js Widgets — Module 2
- **L7** *(built, 2 widgets):* (a) Span visualizer — toggle 1/2/3 vectors and drag a probe vector v₃, watching the span grow line → plane → ℝ³, with a live independence verdict and `dim span` (rank) readout; a third vector that lies in the plane is flagged linearly dependent; (b) linear-combination reachability — slide α₁, α₂ to walk α₁u₁+α₂u₂ over the span plane and chase a target b, reachable **iff** b lies on the plane (built on Grizzle Ex. 7.4: solvable b=(0,−8,5) vs unreachable b=(4,4,4)). Covers Ch. 7: linear combinations, span, existence of Ax=b, linear independence, and the AᵀA / LDLT independence test
- **L8–9:** *(stubs)* continue Ch. 7 — more independence practice, LDLT column counting, existence + uniqueness
- **L10:** Least-squares geometric view — overdetermined system as 3+ lines that don't meet; find closest point
- **L11:** Subspace zoo — toggle null space (purple), column space (teal), show orthogonal complement
- **L12:** Gram-Schmidt animated — start with 3 arbitrary vectors, watch them orthogonalize step by step
- **L13:** QR decomposition — Q as rotation/reflection, R as shear; compose back to reconstruct A
- **L14:** Eigenvalue visualizer — apply matrix, watch most vectors rotate BUT eigenvectors only stretch; λ live
- **L15:** Four fundamental subspaces simultaneously — all four in one 3D widget with orthogonality shown
- **L16:** Full pipeline widget — input A and b, watch flow through LU → QR → solution

---

## MODULE 3 — Nonlinear Methods & Optimization
*Lectures 17–21 | Nov 3 – Nov 17*

**The thread:** The real world is nonlinear. But linear algebra gives us the tools to
*linearize* nonlinear problems and iterate to solutions.

| Lec | Topic | Key Ideas | Robotics Anchor |
|-----|-------|-----------|-----------------|
| 17 | Bisection & Newton's Method (scalar) | Root finding f(x)=0; bisection convergence; Newton as linearization; local slope without calculus | Joint angle satisfying a reach constraint |
| 18 | Vector-valued Functions: Gradient & Jacobian | f: ℝᵐ→ℝⁿ; linear approximation; gradient ∇f; Jacobian J | Robot forward kinematics: J maps joint velocities → Cartesian velocities |
| 19 | Newton-Raphson for Vector Functions | Solve J·Δx = −f iteratively; convergence radius | Inverse kinematics: find joint angles given end-effector position |
| 20 | Optimization: First-Order (Gradient Descent) | argmin f(x); critical points; gradient = 0; step size; loss landscapes | Training a neural network; path planning cost minimization |
| 21 | Optimization: Second-Order Unconstrained | Hessian; Newton's optimization; quadratic approximation; convergence rate | Faster IK; optimal control |

### Three.js Widgets — Module 3
- **L17:** Bisection + Newton's animated on a 2D curve — bracket shrinks vs tangent-line iteration; convergence rate HUD
- **L18:** Jacobian field — 2D robot arm; drag joints, see Jacobian columns as velocity arrows at end-effector
- **L19:** Newton-Raphson IK — drag a target point, watch joint angles converge step-by-step with iteration counter
- **L20:** Loss landscape in 3D — gradient descent ball rolling down a surface; adjust learning rate live
- **L21:** Gradient descent vs Newton's method on same landscape; quadratic approximation bowl shown at each step

---

## MODULE 4 — Geometry, Hyperplanes & Machine Learning
*Lectures 22–24 | Nov 22 – Dec 1*

**The thread:** Linear algebra doesn't just solve equations — it *separates* and *classifies* the world.
This is the foundation of modern ML.

| Lec | Topic | Key Ideas | Robotics Anchor |
|-----|-------|-----------|-----------------|
| 22 | Affine Spaces & Hyperplanes | Hyperplane: {x : wᵀx = b}; orthogonal projection; affine subspace = subspace + offset | Collision detection: is a point on the safe side of a boundary? |
| 23 | Hyperplanes in ℝⁿ, QP & Max-Margin Classifier | Signed distance to hyperplane; support vectors; hard-margin SVM as QP | Terrain classification for a walking robot |
| 24 | Soft Margin & Gaussian SVM | Slack variables; kernel trick; Gaussian RBF kernel; nonlinear decision boundary | Obstacle classification from lidar with non-separable point clouds |

### Three.js Widgets — Module 4
- **L22:** Drag a point cloud in 3D, see its orthogonal projection onto a plane; affine offset shown as shift from origin
- **L23:** Hard-margin SVM — drag 2D point clouds, watch optimal hyperplane and margin bands update live
- **L24:** Kernel SVM — nonlinearly separable data in 2D lifted to 3D via feature map, then linearly separated

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
