import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, Link } from "react-router-dom";
import { useStores } from "@/stores/StoreProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const ProblemDetailView = observer(() => {
  const { problemId } = useParams<{ problemId: string }>();
  const { notebookStore } = useStores();
  useEffect(() => {
    notebookStore.ensureProblemsLoaded();
  }, [notebookStore]);
  const problem = problemId ? notebookStore.getProblemById(problemId) : null;
  const loading =
    notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
        <LoadingIndicator label="Loading problem…" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Problem not found.</p>
        <Button variant="outline" asChild>
          <Link to="/problems">Back to problems</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="link" className="w-fit px-0" asChild>
          <Link to="/problems">← Back to list</Link>
        </Button>
        <p className="text-sm text-muted-foreground">Problem detail</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {problem.description}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My solution</CardTitle>
          <CardDescription>
            Inline edit and save context you want to revisit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={problem.solution ?? ""}
            onChange={(event) =>
              notebookStore.updateProblemUserSolution(
                problem.id,
                event.target.value
              )
            }
            rows={8}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Solution to reference</CardHeader>
        <CardContent>
          <Textarea
            value={problem.idealSolutionCode ?? ""}
            onChange={(event) =>
              notebookStore.updateProblemAiSolution(
                problem.id,
                event.target.value
              )
            }
            rows={6}
            placeholder="AI-assisted approach"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>Note</CardHeader>
        <CardContent>
          <Textarea
            value={problem.note ?? ""}
            onChange={(event) =>
              notebookStore.updateProblemNotes(problem.id, event.target.value)
            }
            rows={4}
            placeholder="Personal notes and context"
          />
        </CardContent>
      </Card>
    </div>
  );
});

export default ProblemDetailView;
