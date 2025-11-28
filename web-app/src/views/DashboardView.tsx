import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ArrowUpRight, Chrome, Sparkles, Target, Timer } from "lucide-react";
import { useStores } from "@/stores/StoreProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const DashboardView = observer(() => {
  const { notebookStore } = useStores();
  useEffect(() => {
    notebookStore.ensureProblemsLoaded();
    notebookStore.ensureNotesLoaded();
  }, [notebookStore]);
  const stats = notebookStore.getStats();
  const upNextProblems = notebookStore.filteredProblems.slice(0, 3);
  const noteHighlights = notebookStore.notes.slice(0, 2);
  const dueCards = notebookStore.filteredReviewCards.slice(0, 4);
  const perDifficultyEntries = Object.entries(stats.perDifficulty);
  const loadingProblems =
    notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems;
  const loadingNotes =
    notebookStore.isLoadingNotes && !notebookStore.hasLoadedNotes;
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-12">
        <header className="space-y-4">
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            DSA Notebook · Beta
          </Badge>
          <div className="flex flex-col gap-6 rounded-3xl border border-border/80 bg-background/90 p-6 shadow-sm shadow-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Welcome back.
              </h1>
              <p className="text-base text-muted-foreground">
                Capture prompts from the Chrome extension, then review on web
                and mobile on the go.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="gap-2">
                <Chrome className="h-4 w-4" />
                Install Chrome Extension
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader className="space-y-2">
              <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                Problems captured
              </CardDescription>
              {loadingProblems ? (
                <LoadingIndicator />
              ) : (
                <>
                  <CardTitle className="text-3xl">{stats.totalProblems}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {perDifficultyEntries
                      .map(([label, value]) => `${label}: ${value}`)
                      .join(" · ")}
                  </p>
                </>
              )}
            </CardHeader>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="space-y-2">
              <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                Notes synced
              </CardDescription>
              {loadingNotes ? (
                <LoadingIndicator />
              ) : (
                <>
                  <CardTitle className="text-3xl">{stats.noteCount}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    From Chrome extension + manual entries
                  </p>
                </>
              )}
            </CardHeader>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="space-y-2">
              <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                Cards due now
              </CardDescription>
              {loadingProblems && loadingNotes ? (
                <LoadingIndicator />
              ) : (
                <>
                  <CardTitle className="text-3xl">{stats.dueCards}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Jump into Review to keep the streak alive
                  </p>
                </>
              )}
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border/80">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Unified timeline</CardTitle>
                <CardDescription>
                  Recently captured problems appear here.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-sm">
                View archive
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingProblems ? (
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <LoadingIndicator label="Loading recent problems…" />
                </div>
              ) : null}
              {upNextProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {problem.questionIndex} · {problem.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last review{" "}
                        {problem.lastReviewedAt
                          ? new Date(
                              problem.lastReviewedAt
                            ).toLocaleDateString()
                          : "Not yet logged"}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-dashed">
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap gap-2">
                    {(problem.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  Real data arrives once API syncing finishes.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle>Next session</CardTitle>
              <CardDescription>
                Plan your next block of focused reps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-muted-foreground/10 bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Timer className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Suggested block</p>
                    <p className="text-xs text-muted-foreground">
                      {dueCards.length} cards waiting · 25 min focus
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-muted-foreground/10 bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Focus pattern</p>
                    <p className="text-xs text-muted-foreground">
                      {(upNextProblems[0]?.tags ?? []).join(", ") || "Tag mix"}
                    </p>
                  </div>
                </div>
              </div>
              <Button className="w-full" variant="secondary">
                Reserve time on calendar
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Chrome className="h-4 w-4 text-primary" />
                  Chrome captures
                </CardTitle>
                <CardDescription>
                  Your freshest notes from the extension land here instantly.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingNotes ? (
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <LoadingIndicator label="Fetching Chrome captures…" />
                </div>
              ) : null}
              {noteHighlights.map((note) => (
                <div
                  key={note.noteId}
                  className="rounded-2xl border border-dashed border-border/70 p-4"
                >
                  <p className="font-medium">
                    {note.topic ?? note.summary ?? note.url}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Flashcards in queue
                </CardTitle>
                <CardDescription>Preview what is due next.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dueCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-2xl border border-muted-foreground/20 bg-muted/40 p-4"
                >
                  <p className="font-medium">{card.prompt}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.sourceTitle}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {dueCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You're caught up. Enjoy the streak!
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
});

export default DashboardView;
