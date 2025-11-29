import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStores } from '@/stores/StoreProvider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LoadingIndicator } from '@/components/ui/loading-indicator'

const ProblemReviewView = observer(() => {
  const { problemId } = useParams<{ problemId: string }>()
  const { notebookStore } = useStores()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    notebookStore.ensureProblemsLoaded()
  }, [notebookStore])

  const loading = notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems
  const problem = problemId ? notebookStore.getProblemById(problemId) : null
  useEffect(() => {
    setStepIndex(0)
  }, [problemId])
  const problems = notebookStore.filteredProblems
  const currentIndex = useMemo(() => problems.findIndex((p) => p.id === problem?.id), [problems, problem])
  const prevProblemId = currentIndex > 0 ? problems[currentIndex - 1]?.id : null
  const nextProblemId = currentIndex >= 0 && currentIndex < problems.length - 1 ? problems[currentIndex + 1]?.id : null
  const card = problem ? notebookStore.getProblemReviewCard(problem.id) : null
  const steps = [
    {
      label: 'Problem description',
      content: problem?.description ?? '',
    },
    {
      label: 'Your solution',
      content: problem?.solution ?? 'Capture your solution from Chrome to sync it here.',
    },
    {
      label: 'Personal notes',
      content: problem?.note ?? 'Add reminders or edge cases in the detail view.',
    },
    {
      label: 'AI analysis',
      content: problem?.idealSolutionCode ?? 'AI solution coming soon.',
    },
  ]

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
        <LoadingIndicator label="Loading problem review…" />
      </div>
    )
  }

  if (!problem || !card) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Unable to find that problem. It might not be synced yet.
        </p>
        <Button variant="outline" asChild>
          <Link to="/problems">Back to problems</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="link" className="w-fit px-0 text-sm" asChild>
          <Link to="/problems">← All problems</Link>
        </Button>
        <p className="text-sm text-muted-foreground">Focused review</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {problem.questionIndex} · {problem.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{problem.difficulty}</Badge>
          {(problem.tags ?? []).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Card className="border-border/80">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Anki steps</CardTitle>
            <CardDescription>{`Step ${stepIndex + 1} of ${steps.length}`}</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold">{steps[stepIndex].label}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl border border-dashed border-border/80 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {steps[stepIndex].label}
            </p>
            <Separator className="my-4" />
            <p className="text-lg text-slate-900 whitespace-pre-line">
              {steps[stepIndex].content}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            >
              Previous
            </Button>
            {stepIndex < steps.length - 1 ? (
              <Button
                className="flex-1"
                onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => setStepIndex(0)}
              >
                Restart steps
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => notebookStore.gradeReviewCard(card.id, 'hard')}
            >
              Hard
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => notebookStore.gradeReviewCard(card.id, 'good')}
            >
              Good
            </Button>
            <Button className="flex-1" onClick={() => notebookStore.gradeReviewCard(card.id, 'easy')}>
              Easy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Card tags</CardTitle>
          <CardDescription>
            {`Due ${new Date(card.due).toLocaleString()} · streak ${card.streak}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            {card.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(`/review/problems/${problem.id}`)}
        >
          Replay card
        </Button>
        <Button
          variant="outline"
          disabled={!prevProblemId}
          onClick={() => prevProblemId && navigate(`/review/problems/${prevProblemId}`)}
        >
          Previous problem
        </Button>
        <Button
          variant="outline"
          disabled={!nextProblemId}
          onClick={() => nextProblemId && navigate(`/review/problems/${nextProblemId}`)}
        >
          Next problem
        </Button>
        <Button variant="link" className="text-primary" asChild>
          <Link to="/review">Back to queue</Link>
        </Button>
      </div>
    </div>
  )
})

export default ProblemReviewView
