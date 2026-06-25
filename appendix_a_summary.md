# Appendix A: Cool and Important Things Omitted From our Linear Algebra Introduction

## Overview
This appendix introduces advanced linear algebra concepts typically covered in second- or third-year university courses, bridging the gap between introductory matrix operations and their advanced applications in engineering and robotics. Key topics include:
1. **Complex Numbers & Vectors:** Cartesian and polar representations, Euler's formula, and linear difference equations.
2. **Eigenvalues & Eigenvectors:** General square matrices, real symmetric matrices, and diagonal factoring ($A = Q \Lambda Q^T$).
3. **Positive Definite Matrices:** Quadratic forms, tests for positive definiteness ($LDL^T$ and LU factorization), and the Schur Complement Theorem.
4. **Singular Value Decomposition (SVD):** Singular values, matrix rank, nullity, and numerical linear independence.
5. **Linear & Affine Transformations:** Matrix representations of linear operators (e.g., polynomial differentiation) and affine shifts ($Ax + b$).

---

## A.1 Complex Numbers and Complex Vectors

### Basic Definitions
* **Imaginary Unit:** $i := \sqrt{-1}$, satisfying $i^2 = -1$.
* **Complex Number Set:** $\mathbb{C} := \{x + i y \mid x, y \in \mathbb{R}\}$, where $x = \text{real}(z)$ and $y = \text{imag}(z)$.
* **Complex Conjugate:** $z^* := x - i y$. Multiplying a complex number by its conjugate yields a real number:
  $$z \cdot z^* = x^2 + y^2 = |z|^2$$
* **Magnitude:** $|z| := \sqrt{x^2 + y^2} = \sqrt{z \cdot z^*}$.

### Polar Coordinates & Euler's Formula
A complex number can be expressed in polar form $(\rho, \theta)$:
$$z = \rho(\cos\theta + i \sin\theta) = |z| e^{i \theta}$$
where Euler's Formula defines the complex exponential:
$$e^{i \theta} := \cos(\theta) + i \sin(\theta)$$
* **Multiplication in Polar Form:** Multiply magnitudes and add angles:
  $$z_1 \cdot z_2 = |z_1||z_2| e^{i(\theta_1 + \theta_2)}$$
* **Division in Polar Form:** Divide magnitudes and subtract angles:
  $$\frac{z_1}{z_2} = \frac{|z_1|}{|z_2|} e^{i(\theta_1 - \theta_2)}$$

### Complex Vectors ($\mathbb{C}^n$)
$\mathbb{C}^n$ is the space of $n$-tuples of complex numbers. The vector operations follow the same rules as $\mathbb{R}^n$, but scalars are complex.
* **Complex Vector Norm:**
  $$\|v\|_2 = \sqrt{\sum_{k=1}^n |v_k|^2} = \sqrt{(v^*)^T v}$$

### Scalar Linear Difference Equations
The system $z_{k+1} = a z_k$ with $a, z_0 \in \mathbb{C}$ has the general solution:
$$z_k = a^k z_0 = |a|^k e^{i k \angle a} z_0$$
* If $|a| < 1$, the trajectory spirals inward and decays: $\lim_{k \to \infty} |z_k| = 0$.
* If $|a| > 1$, the trajectory spirals outward and blows up: $\lim_{k \to \infty} |z_k| = \infty$.
* If $|a| = 1$, the trajectory rotates counterclockwise on a circle of radius $|z_0|$.

### Matrix Linear Difference Equations
For $z[k+1] = A z[k]$ with complex eigenvalues $\lambda = |\lambda| e^{i \theta}$ and eigenvectors $v = v_{\text{Re}} + i v_{\text{Im}}$, the matrix acts as both a scaling factor (by $|\lambda|$) and a rotation (by $\theta$) in the 2D plane spanned by $\{v_{\text{Re}}, v_{\text{Im}}\}$:
$$A^k \begin{bmatrix} v_{\text{Re}} \\ v_{\text{Im}} \end{bmatrix} = |\lambda|^k \begin{bmatrix} \cos(k\theta) I_n & -\sin(k\theta) I_n \\ \sin(k\theta) I_n & \cos(k\theta) I_n \end{bmatrix} \begin{bmatrix} v_{\text{Re}} \\ v_{\text{Im}} \end{bmatrix}$$

---

## A.2 Eigenvalues and Eigenvectors

### General Definition
Let $A$ be an $n \times n$ matrix with real or complex coefficients. A scalar $\lambda \in \mathbb{C}$ is an eigenvalue if there exists a non-zero vector $v \in \mathbb{C}^n$ (eigenvector) satisfying:
$$Av = \lambda v \iff (\lambda I - A)v = 0 \iff \det(\lambda I - A) = 0$$

### Key Algebraic Properties
* **Algebraic Multiplicity ($m_i$):** The multiplicity of the root $\lambda_i$ in the characteristic polynomial. The sum of algebraic multiplicities is always $n$ (Fundamental Theorem of Algebra).
* **Geometric Multiplicity:** The number of linearly independent eigenvectors associated with $\lambda_i$, given by $\dim(\text{null}(A - \lambda_i I))$. It satisfies $1 \le \text{geometric multiplicity} \le m_i$.
* **Complex Conjugate Pairs:** If $A$ is real and has a complex eigenvalue $\lambda_i$, then its conjugate $\lambda_i^*$ is also an eigenvalue.
* **Distinct Eigenvalue Theorem:** If an $n \times n$ matrix has $n$ distinct eigenvalues, its eigenvectors are linearly independent and form a basis for $\mathbb{C}^n$.

### Real Symmetric Matrices ($A = A^T$)
Symmetric matrices have highly structured eigenstuff:
1. **Real Eigenvalues:** All eigenvalues are real numbers ($\lambda_i \in \mathbb{R}$).
2. **Orthogonal Eigenvectors:** Eigenvectors corresponding to distinct eigenvalues are orthogonal ($v_i \perp v_j$).
3. **Spectral Decomposition (Factoring):** Every symmetric matrix can be factored into a product of an orthogonal matrix $Q$ (columns are orthonormal eigenvectors) and a diagonal matrix $\Lambda$ (eigenvalues):
   $$A = Q \Lambda Q^T = \sum_{i=1}^n \lambda_i v_i v_i^T$$
   The inverse is computed simply via: $A^{-1} = Q \Lambda^{-1} Q^T$.

---

## A.3 Positive Definite Matrices

### Quadratic Forms
A quadratic form of an $n \times n$ symmetric matrix $P$ is:
$$f(x) = x^T P x$$
For any symmetric matrix $P$, the quadratic form is bounded by its extreme eigenvalues:
$$\lambda_{\text{min}} \|x\|_2^2 \le x^T P x \le \lambda_{\text{max}} \|x\|_2^2$$

### Positive Definite and Semidefinite Definitions
* **Positive Definite ($P > 0$):** $x^T P x > 0$ for all $x \neq 0 \iff$ all eigenvalues $\lambda_i > 0$.
* **Positive Semidefinite ($P \ge 0$):** $x^T P x \ge 0$ for all $x \iff$ all eigenvalues $\lambda_i \ge 0$.
* **Fact:** $P \ge 0 \iff P = N^T N$ for some matrix $N$. If the columns of $N$ are independent, $P > 0$.

### Testing for $P > 0$
Computing eigenvalues is computationally expensive. Better methods use matrix factorization:
1. **$LDL^T$ Factorization:** Factorize $Q P Q^T = L D L^T$. Then $P > 0 \iff$ all diagonal entries of $D$ are strictly positive.
2. **LU Factorization (Without Permutations):** Factorize $P = L U$. If it succeeds, write $U = D L^T$. Then $P > 0 \iff$ all diagonal entries of the diagonal matrix $D$ are positive.

### Schur Complement Theorem
For a symmetric block matrix $M = \begin{bmatrix} A & B \\ B^T & C \end{bmatrix}$:
$$M > 0 \iff A > 0 \text{ and } C - B^T A^{-1} B > 0 \quad (\text{where } C - B^T A^{-1} B \text{ is the Schur complement of } A)$$

---

## A.4 Singular Value Decomposition (SVD)

### Motivation: Numerical Linear Independence
In theory, vectors are either independent or dependent. In practice, vectors can be "nearly" dependent. SVD provides a quantitative measure of this closeness to dependency.

### The SVD Theorem
Any $n \times m$ real matrix $A$ can be factored as:
$$A = U \Sigma V^T$$
where:
* $U$ is an $n \times n$ orthogonal matrix (eigenvectors of $A A^T$).
* $V$ is an $m \times m$ orthogonal matrix (eigenvectors of $A^T A$).
* $\Sigma$ is an $n \times m$ rectangular diagonal matrix containing singular values $\sigma_1 \ge \sigma_2 \ge \dots \ge \sigma_p \ge 0$ (where $p = \min(n, m)$).
* **Rank-One Expansion:** $A = \sum_{i=1}^p \sigma_i u_i v_i^T$.

### Rank and Subspaces
* **Rank:** $\text{rank}(A) = r$, where $r$ is the number of non-zero singular values. The first $r$ columns of $U$ form a basis for $\text{range}(A)$.
* **Nullity:** $\text{nullity}(A) = m - r$. The last $m - r$ columns of $V$ form a basis for $\text{null}(A)$.
* **Numerical/Effective Rank:** If singular values fall below a small threshold $\delta$, they are treated as zero, defining an effective rank $r_{\text{eff}}$ which describes the numerical range and null space of $A$.

---

## A.5 Linear and Affine Transformations

### Linear Transformations
A function $L: \mathbb{R}^m \to \mathbb{R}^n$ is linear if:
$$L(\alpha x + \beta z) = \alpha L(x) + \beta L(z)$$
Every linear transformation can be represented as a matrix multiplication: $L(x) = Ax$, where column $j$ of $A$ is the image of the $j$-th canonical basis vector: $a_j^{\text{col}} = L(e_j)$.

### Matrix Representation of Operators (Differentiation)
Vector spaces are not limited to column vectors. For example, the space of polynomials $P_n(t)$ of degree $\le n$ is a vector space with basis $\{1, t, t^2, \dots, t^n\}$.
* A polynomial $p(t) = a_0 + a_1 t + \dots + a_n t^n$ is represented by the coordinate vector $[a_0, a_1, \dots, a_n]^T \in \mathbb{R}^{n+1}$.
* The differentiation operator $L(p(t)) = \frac{d}{dt} p(t)$ is a linear transformation. Its matrix representation $A$ is:
  $$A = \begin{bmatrix} 0 & 1 & 0 & \dots & 0 \\ 0 & 0 & 2 & \dots & 0 \\ \vdots & \vdots & \vdots & \ddots & \vdots \\ 0 & 0 & 0 & \dots & n \\ 0 & 0 & 0 & \dots & 0 \end{bmatrix}$$
  This converts the calculus operation of differentiation into a simple matrix-vector multiplication $A [x]_v = [L(x)]_v$, which is used for real-time signal differentiation in robotics.

### Affine Transformations
A function $f: \mathbb{R}^m \to \mathbb{R}^n$ is **affine** if it is a linear transformation shifted by a constant translation vector $b \in \mathbb{R}^n$:
$$f(x) = Ax + b$$
