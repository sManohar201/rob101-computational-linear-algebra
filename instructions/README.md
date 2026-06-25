# Implementation Guide: Mathematics for Robotics Visual Learning Lab

Welcome to the implementation phase of the Mathematics for Robotics Visual Learning Lab. As the junior engineer, you will be building the interactive React + Three.js components for:
*   **Part 2**: Calculus for the Modern Engineer (ROB 201 — Lectures 25–41)
*   **Part 3**: Advanced Mathematics & Estimation (ROB 501 — Lectures 42–57)

This directory contains comprehensive specifications and mathematical layouts for every single lecture to ensure 100% textbook alignment.

---

## 🛠 GENERAL ARCHITECTURE & RULES

### 1. Template Structure for a Lecture (`src/lessons/mN/LXX.jsx`)
Every lecture should follow the standard 6-section structure as shown in the original [COURSE_PLAN.md](file:///media/sam/whatever/computational_linear_algebra/course/COURSE_PLAN.md). Use `src/lessons/m2/L07.jsx` as a syntax template.

Here is the skeleton layout to copy and customize:
```jsx
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { InlineMath, DisplayMath } from '../../components/Math.jsx'
import { useOrbitScene } from '../shared/useOrbitScene.js'
import { useAnimatedParams } from '../shared/useAnimatedParams.js'
import { fmt, SliderRow, QuizQ } from '../shared/ui.jsx'
import { COL, tube, sphere, axisArrow, gridFloor, label, disposeObject } from '../shared/three-helpers.js'

export default function LXX() {
  return (
    <div className="lesson-view">
      <div className="lesson-header">
        <h1>Lecture XX: Topic Title</h1>
        <p className="subtitle">Conceptual Focus</p>
      </div>

      {/* SECTION 1: INTUITION */}
      <section className="pedagogy-section">
        <h2>1. Intuition</h2>
        <p>Conceptual, physical analogy without math first...</p>
      </section>

      {/* SECTION 2: INTERACTIVE WIDGET */}
      <section className="pedagogy-section">
        <h2>2. Interactive Visualizer</h2>
        {/* Render your widget component here */}
        <MyInteractiveWidget />
      </section>

      {/* SECTION 3: FORMALISM */}
      <section className="pedagogy-section">
        <h2>3. Mathematical Formalism</h2>
        <p>Derivations rendered using KaTeX...</p>
        <DisplayMath>{'f(x) = \\int_{a}^{b} g(t) dt'}</DisplayMath>
      </section>

      {/* SECTION 4: WORKED EXAMPLE */}
      <section className="pedagogy-section">
        <h2>4. Worked Numerical Example</h2>
        <div className="example-card">
          <p>Worked numbers that match the widget's parameters...</p>
        </div>
      </section>

      {/* SECTION 5: ROBOTICS ANCHOR */}
      <section className="pedagogy-section">
        <h2>5. Robotics Application</h2>
        <p>Concrete application on a physical robot or estimation framework...</p>
      </section>

      {/* SECTION 6: SPACED-REPETITION QUIZ */}
      <section className="pedagogy-section">
        <h2>6. Spaced-Repetition Quiz</h2>
        <QuizQ
          question="A conceptual question based on geometry?"
          options={["Option A", "Option B", "Option C"]}
          answer={0}
          explanation="Why option A is correct based on the projection theorem..."
        />
      </section>
    </div>
  )
}
```

### 2. Using the Shared Toolkit (`src/lessons/shared/`)
*   **`three-helpers.js`**: Standard geometries. Always clean up references in `useEffect`:
    ```javascript
    dyn.current.forEach(o => { scene.remove(o); disposeObject(o) });
    dyn.current = [];
    ```
*   **`useOrbitScene.js`**: Setup camera, lighting, and manual orbit.
*   **`useAnimatedParams.js`**: Easing parameters for smooth sliding transitions.
*   **`Math.jsx`**: Memoized `InlineMath` and `DisplayMath` KaTeX wrappers.
*   **`ui.jsx`**: Number formatting `fmt` and sliders `SliderRow`.

---

## 📂 SUBFOLDERS & TARGETS

*   Create **Part 2** files under `src/lessons/m5/` (Module 5), `src/lessons/m6/` (Module 6), `src/lessons/m7/` (Module 7), and `src/lessons/m8/` (Module 8).
*   Create **Part 3** files under `src/lessons/m9/` (Module 9), `src/lessons/m10/` (Module 10), `src/lessons/m11/` (Module 11), and `src/lessons/m12/` (Module 12).

Refer to the detailed lesson specs in:
1.  [PART2_CALCULUS_GUIDE.md](file:///media/sam/whatever/computational_linear_algebra/course/instructions/PART2_CALCULUS_GUIDE.md) (ROB 201)
2.  [PART3_ADVANCED_MATH_GUIDE.md](file:///media/sam/whatever/computational_linear_algebra/course/instructions/PART3_ADVANCED_MATH_GUIDE.md) (ROB 501)
