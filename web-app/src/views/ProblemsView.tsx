import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router-dom'
import { useStores } from '@/stores/StoreProvider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const difficulties: Array<'All' | 'Easy' | 'Medium' | 'Hard'> = ['All', 'Easy', 'Medium', 'Hard']

const ProblemsView = observer(() => {
  const { notebookStore } = useStores()
  const { filteredProblems, problemTags, difficultyFilter, tagFilters } = notebookStore
  useEffect(() => {
    notebookStore.ensureProblemsLoaded()
  }, [notebookStore])
  const initialLoading = notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Notebook</p>
          <h1 className="text-3xl font-semibold tracking-tight">DSA problems</h1>
          <p className="text-sm text-muted-foreground">
            Filter by difficulty and tags, then drill into the detail page for inline editing.
          </p>
        </div>
        <Input
          placeholder="Search by title or #"
          value={notebookStore.searchQuery}
          onChange={(event) => notebookStore.setSearchQuery(event.target.value)}
          className="lg:w-72"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {difficulties.map((difficulty) => (
          <Button
            key={difficulty}
            variant={difficultyFilter === difficulty ? 'default' : 'outline'}
            onClick={() => notebookStore.setDifficultyFilter(difficulty)}
          >
            {difficulty}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {problemTags.map((tag) => (
          <Badge
            key={tag}
            variant={tagFilters.has(tag) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => notebookStore.toggleTagFilter(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {notebookStore.problemsError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {notebookStore.problemsError}
        </div>
      ) : null}

      <div className="grid gap-4">
        {initialLoading ? (
          <div className="rounded-2xl border border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground">
            Loading problems…
          </div>
        ) : null}
        {filteredProblems.map((problem) => (
          <Card key={problem.id} className="border-border/70">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">
                  {problem.questionIndex} · {problem.title}
                </CardTitle>
                <CardDescription>
                  Last review{' '}
                  {problem.lastReviewedAt
                    ? new Date(problem.lastReviewedAt).toLocaleDateString()
                    : '—'}
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-dashed">
                {problem.difficulty}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{problem.description}</p>
              <div className="flex flex-wrap gap-2">
                {(problem.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/problems/${problem.id}`}>Open problem</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/review`}>Add to review queue</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!initialLoading && filteredProblems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            No problems match your filters yet.
          </div>
        ) : null}
      </div>
    </div>
  )
})

export default ProblemsView
