import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Link, useParams } from 'react-router-dom'
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

  useEffect(() => {
    notebookStore.ensureProblemsLoaded()
  }, [notebookStore])

  const loading = notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems
  const problem = problemId ? notebookStore.getProblemById(problemId) : null
  const card = problem ? notebookStore.getProblemReviewCard(problem.id) : null

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

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Prompt</CardTitle>
          <CardDescription>Use your own words to explain the optimal approach.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Question</p>
            <p className="text-base text-foreground">{problem.description}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Your saved answer</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {problem.solution ?? 'Capture your solution from Chrome to sync it here.'}
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {problem.note ?? 'Add reminders or edge cases in the detail view.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Grade yourself</CardTitle>
          <CardDescription>
            {`Due ${new Date(card.due).toLocaleString()} · streak ${card.streak}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Prompt</p>
            <p className="text-lg font-semibold text-foreground">{card.prompt}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Answer</p>
            <p className="text-base text-muted-foreground">{card.answer}</p>
            {card.extra ? (
              <p className="text-sm text-muted-foreground">{card.extra}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
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
    </div>
  )
})

export default ProblemReviewView
