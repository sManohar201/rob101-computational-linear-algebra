import { findLecture } from '../data/curriculum.js'
import Stub from '../lessons/Stub.jsx'

export default function LessonView({ lectureId }) {
  const lecture = findLecture(lectureId)
  if (!lecture) return <div style={{ padding: 48, color: '#555' }}>Lecture not found.</div>

  const Component = lecture.component
  if (!Component) return <Stub lecture={lecture} />
  return <Component />
}
