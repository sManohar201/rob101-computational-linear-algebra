# Chapter 10: The Vector Space $\mathbb{R}^n$: Part 3

## Overview
This chapter extends the study of vector spaces in $\mathbb{R}^n$ by introducing three major pillars of linear algebra:
1. **Coordinates & Bases:** Defining coordinate systems adapted to subspaces.
2. **Eigenvalues & Eigenvectors ("Eigenstuff"):** Analyzing how square matrices scale vectors along specific characteristic directions.
3. **Fundamental Subspaces & Dimensionality:** Formalizing the Range, Column Span, Null Space, and proving the Rank-Nullity Theorem.

---

## 10.1 Motivation & Applications
Understanding coordinates, bases, eigenvalues, and rank/nullity is critical across engineering:
* **Computer Vision (EECS 442):** Image representation and feature spaces.
* **Machine Learning (EECS 445):** Dimensionality reduction and data representation.
* **Control Systems (ME 561):** Dynamic response analysis and feedback control design.

---

## 10.2 Basis Vectors, Coordinates, and Dimension

### Definitions
* **Basis:** A set of vectors $\{v_1, v_2, \dots, v_k\}$ is a basis for a subspace $V$ if:
  1. The set is **linearly independent**.
  2. The set **spans** $V$ (i.e., $\text{span}\{v_1, \dots, v_k\} = V$).
* **Dimension:** The dimension of a subspace $V$, denoted $\dim(V)$, is the number of vectors $k$ in its basis.
* **"Goldilocks" Intuition:** A basis is a set of vectors that is "just the right size":
  * *Not too big* (remains linearly independent).
  * *Not too small* (spans the entire subspace).

### Vector Representation & Coordinates
Every vector $x \in V$ can be uniquely expressed as a linear combination of the basis vectors:
$$x = \alpha_1 v_1 + \alpha_2 v_2 + \dots + \alpha_k v_k$$

Stacking the coefficients forms the **representation** of $x$ in the basis:
$$[x]_{\{v_1, \dots, v_k\}} := \begin{bmatrix} \alpha_1 \\ \alpha_2 \\ \vdots \\ \alpha_k \end{bmatrix}$$
where the tuple $(\alpha_1, \dots, \alpha_k)$ represents the **coordinates** of $x$.

### Natural (Canonical) Basis
The canonical basis for $\mathbb{R}^n$ is $\{e_1, e_2, \dots, e_n\}$, where $e_i$ is the $i$-th column of the $n \times n$ identity matrix $I_n$. 

### Columns of Matrices and Bases of $\mathbb{R}^n$
For an $n \times n$ square matrix $A$:
$$\det(A) \neq 0 \iff \text{Columns of } A \text{ are linearly independent} \iff \text{Columns of } A \text{ form a basis for } \mathbb{R}^n$$

* **Julia / QR Connection:** To test if a set of vectors forms a basis, stack them into a matrix $A$ and compute $\det(A)$. Gram-Schmidt (via QR decomposition) can build an orthonormal basis $\{q_1, \dots, q_n\}$ from these columns.

---

## 10.3 Eigenvalues and Eigenvectors

### Definitions
* **Eigenvector:** A non-zero vector $v \in \mathbb{R}^n$ is an eigenvector of an $n \times n$ matrix $A$ if multiplying $A$ by $v$ scales the vector without changing its direction:
  $$Av = \lambda v$$
* **Eigenvalue:** The scalar $\lambda$ associated with the eigenvector $v$.
* **Etymology:** "Eigen" is a German word meaning *own*, *characteristic*, or *self*. 

### Finding Eigenvalues & Eigenvectors
To find non-zero solutions to $Av = \lambda v$, rewrite the equation as:
$$(\lambda I - A)v = 0$$
For non-zero $v$ to exist, the matrix $(\lambda I - A)$ must be singular (have linearly dependent columns), which means:
$$\det(\lambda I - A) = 0$$
This is the **characteristic equation**. Solving it yields the eigenvalues $\lambda$, after which the eigenvectors are found by solving the null space system $(A - \lambda I)v = 0$.

### Core Concepts
1. **Eigenbasis Theorem:** If an $n \times n$ matrix $A$ has real and *distinct* eigenvalues $\{\lambda_1, \dots, \lambda_n\}$, then its eigenvectors $\{v_1, \dots, v_n\}$ form a basis for $\mathbb{R}^n$.
2. **Complex Eigenstuff:** If the characteristic equation has complex roots, eigenvalues and eigenvectors occur in complex conjugate pairs: $\lambda_2 = \lambda_1^*$ and $v_2 = v_1^*$.
3. **Symmetric Matrices:** Real symmetric matrices ($A = A^T$) always have real eigenvalues, and their eigenvectors can be chosen to be orthonormal.
4. **Action of Matrix Powers:** Multiplying a vector $x$ repeatedly by $A$ ($A^k x$) results in the vector aligning with the eigenvector corresponding to the dominant eigenvalue (the eigenvalue with the largest magnitude $|\lambda|$):
   $$A^k x = \alpha_1 (\lambda_1)^k v_1 + \alpha_2 (\lambda_2)^k v_2 + \dots + \alpha_n (\lambda_n)^k v_n$$
   * If $|\lambda_i| < 1$, the component along $v_i$ decays to $0$.
   * If $|\lambda_i| > 1$, the component along $v_i$ explodes to $\infty$.

---

## 10.4 Range, Column Span, and Null Space

### Subspace Definitions
* **Null Space of $A$:** The set of all vectors that are mapped to the zero vector by $A$:
  $$\text{null}(A) := \{x \in \mathbb{R}^m \mid Ax = 0_{n \times 1}\}$$
* **Range (Column Space) of $A$:** The set of all possible outputs $y = Ax$:
  $$\text{range}(A) := \{y \in \mathbb{R}^n \mid y = Ax \text{ for some } x \in \mathbb{R}^m\}$$
  The range is equivalent to the span of the columns of $A$ ($\text{col span}\{A\}$).

### Relation to System Solutions ($Ax = b$)
* **Solvability:** $Ax = b$ has a solution if and only if $b \in \text{range}(A)$.
* **Uniqueness:** If a solution exists, it is unique if and only if $\text{null}(A) = \{0\}$.
* **General Solution:** If $x_p$ is a particular solution to $Ax = b$, the complete solution set is:
  $$x = x_p + \eta \quad \text{where } \eta \in \text{null}(A)$$

### Computing the Null Space
Because $Ax = 0 \iff x$ is orthogonal to every row of $A$, the null space consists of vectors orthogonal to the rows of $A$:
$$x \in \text{null}(A) \iff x \perp (a^{\text{row}}_i)^T \quad \text{for } 1 \le i \le n$$

* **Algorithm:** Gram-Schmidt can be run on the set of row vectors augmented with identity columns to find the orthogonal complement, which forms a basis for the null space.

---

## 10.5 Rank and Nullity

### Key Definitions
* **Rank of $A$:** The dimension of the range (column space) of $A$:
  $$\text{rank}(A) := \dim(\text{range}(A))$$
* **Nullity of $A$:** The dimension of the null space of $A$:
  $$\text{nullity}(A) := \dim(\text{null}(A))$$

### The Rank-Nullity Theorem
For any $n \times m$ matrix $A$ (where $m$ is the number of columns):
$$\text{rank}(A) + \text{nullity}(A) = m$$

### Useful Identities
* $\text{rank}(A^T \cdot A) = \text{rank}(A)$
* $\text{rank}(A^T) = \text{rank}(A)$
* $\text{nullity}(A^T \cdot A) = \text{nullity}(A)$
* $\text{nullity}(A^T) + m = \text{nullity}(A) + n$
* $\text{rank}(A \cdot B) \le \text{rank}(A)$

---

## 10.6 Proof of the Rank-Nullity Theorem (Summary)
The proof constructs a partition of the matrix $A = [A_1 \;\; A_2]$ where the columns of $A_1$ (dimension $\rho = \text{rank}(A)$) are linearly independent and the columns of $A_2$ depend on $A_1$ via $A_2 = A_1 B$.
Using the relation $Ax = 0$, we find:
$$Ax = 0 \iff x_1 + B x_2 = 0 \iff x_1 = -B x_2$$
Since $x_2 \in \mathbb{R}^{m - \rho}$ can be chosen freely, this maps each of the canonical basis vectors of $\mathbb{R}^{m - \rho}$ to a basis of the null space, proving that $\dim(\text{null}(A)) = m - \rho$, which completes:
$$\text{rank}(A) + \text{nullity}(A) = m$$

---

## 10.7 Looking Ahead: Nonlinear Optimization
The chapter concludes by motivating the transition from linear algebra to nonlinear systems:
1. **Root Finding:** Solving $f(x) = 0$ by local linearization (Newton's method).
2. **Optimization:** Minimizing a cost function $c(x)$ (e.g., least squares $\|Ax - b\|_2^2$).
* **Robotics Application:** These optimization and root-finding routines are used in bipedal robot control (e.g., Segway balance and Cassie Blue biped dynamics at Michigan).
