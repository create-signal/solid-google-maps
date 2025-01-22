import { MetaTags } from '~/components/meta-tags'
import Quiz from '~/examples/quiz'
export default function QuizRoute() {
  return (
    <>
      <MetaTags title="Country Quiz" description="Name the country!" />
      <Quiz />
    </>
  )
}
