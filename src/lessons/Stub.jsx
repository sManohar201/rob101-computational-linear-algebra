export default function Stub({ lecture }) {
  const mod = lecture.module
  return (
    <div className="lesson stub-lesson">
      <div className="lesson-header">
        <div
          className="module-tag"
          style={{
            background: `color-mix(in srgb, ${mod?.color ?? '#888'} 12%, transparent)`,
            color: mod?.color ?? '#888',
            borderColor: `color-mix(in srgb, ${mod?.color ?? '#888'} 30%, transparent)`,
          }}
        >
          {mod?.title} · Lecture {lecture.num}
        </div>
        <h1 className="lesson-title">{lecture.title}</h1>
        <p className="lesson-subtitle">{mod?.thread}</p>
      </div>

      <div className="stub-content">
        <div className="stub-icon">🚧</div>
        <h2>Coming Soon</h2>
        <p>This lecture is being built. When complete, it will include:</p>
        <ul>
          <li>A live Three.js 3D interactive widget</li>
          <li>Full mathematical derivations with KaTeX</li>
          <li>Robotics / ML applications</li>
          <li>Worked numerical examples</li>
          <li>An interactive quiz with instant feedback</li>
          <li>A spaced-repetition review schedule</li>
        </ul>
      </div>
    </div>
  )
}
