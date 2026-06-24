// ─── Small dense linear-algebra kernels (no deps) ────────────────────────────
// Used by the widgets to *locate* solutions and classify systems. The lessons
// themselves teach substitution/elimination; these just drive the geometry.

// Solve a square system A x = b by Gauss–Jordan with partial pivoting.
// Returns an array x, or null if A is singular.
export function solveLinear(A, b) {
  const n = A.length
  const M = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    }
    if (Math.abs(M[piv][col]) < 1e-12) return null
    ;[M[col], M[piv]] = [M[piv], M[col]]

    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / M[col][col]
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row, i) => row[n] / row[i][i])
}

// Classify a square system: 'unique' (+x), 'none', or 'infinite'.
// Works by reducing the augmented matrix and comparing ranks.
export function classify(A, b) {
  const rows = A.length
  const cols = A[0].length
  const M = A.map((row, i) => [...row, b[i]])

  let r = 0
  for (let c = 0; c < cols && r < rows; c++) {
    let piv = r
    for (let i = r + 1; i < rows; i++) {
      if (Math.abs(M[i][c]) > Math.abs(M[piv][c])) piv = i
    }
    if (Math.abs(M[piv][c]) < 1e-9) continue
    ;[M[r], M[piv]] = [M[piv], M[r]]

    const pv = M[r][c]
    for (let j = c; j <= cols; j++) M[r][j] /= pv
    for (let i = 0; i < rows; i++) {
      if (i === r) continue
      const f = M[i][c]
      if (Math.abs(f) > 1e-12) for (let j = c; j <= cols; j++) M[i][j] -= f * M[r][j]
    }
    r++
  }

  // A zero row in A with nonzero augment ⇒ contradiction ⇒ no solution.
  for (let i = 0; i < rows; i++) {
    let allZero = true
    for (let j = 0; j < cols; j++) if (Math.abs(M[i][j]) > 1e-9) { allZero = false; break }
    if (allZero && Math.abs(M[i][cols]) > 1e-9) return { type: 'none' }
  }

  if (r < cols) return { type: 'infinite' }

  const x = new Array(cols)
  for (let i = 0; i < cols; i++) x[i] = M[i][cols]
  return { type: 'unique', x }
}

// Symmetric LDLᵀ of M = AᵀA with diagonal (symmetric) pivoting — Grizzle §7.6.
// `cols` is an array of m column vectors (each an array of length n). Because
// M = AᵀA is symmetric positive-semidefinite, the number of non-negligible
// pivots equals the number of linearly independent columns of A (= dim span).
// Returns { diagD, rank, perm }: diagD holds the pivots in elimination order
// (the diagonal of D), rank counts the non-zero ones, and perm maps elimination
// step → original column index, so the first `rank` entries of perm name an
// independent subset of the columns (the first k columns of A·Pᵀ).
export function ataLDLT(cols, tol = 1e-7) {
  const m = cols.length
  if (m === 0) return { diagD: [], rank: 0, perm: [] }
  const n = cols[0].length
  // M = AᵀA  (m × m, symmetric, positive semidefinite)
  const M = Array.from({ length: m }, (_, i) =>
    Array.from({ length: m }, (_, j) => {
      let s = 0
      for (let r = 0; r < n; r++) s += cols[i][r] * cols[j][r]
      return s
    }))
  const perm = Array.from({ length: m }, (_, i) => i)
  const diagD = new Array(m).fill(0)
  const scale = Math.max(1e-12, ...M.map((row, i) => Math.abs(row[i])))
  let rank = 0
  for (let i = 0; i < m; i++) {
    // pivot on the largest remaining diagonal entry (the book's argmax)
    let p = i
    for (let k = i + 1; k < m; k++) if (M[k][k] > M[p][p]) p = k
    if (M[p][p] <= tol * scale) break // PSD ⇒ the rest of the block is ~0
    if (p !== i) {
      ;[M[i], M[p]] = [M[p], M[i]]                       // swap rows i,p …
      for (let r = 0; r < m; r++) { const t = M[r][i]; M[r][i] = M[r][p]; M[r][p] = t } // … and cols
      ;[perm[i], perm[p]] = [perm[p], perm[i]]
    }
    const pivot = M[i][i]
    diagD[i] = pivot
    rank++
    for (let r = i + 1; r < m; r++) {
      const f = M[r][i] / pivot
      if (f === 0) continue
      for (let c = i + 1; c < m; c++) M[r][c] -= f * M[i][c]
    }
  }
  return { diagD, rank, perm }
}

export function det2(a, b, c, d) { return a * d - b * c }

// Determinant of a 3×3 given as nested rows [[a,b,c],[d,e,f],[g,h,i]].
export function det3(M) {
  const [[a, b, c], [d, e, f], [g, h, i]] = M
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
}
