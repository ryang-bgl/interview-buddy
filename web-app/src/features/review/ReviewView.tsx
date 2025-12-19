import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "@/stores/StoreProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const ReviewView = observer(() => {
  const { notebookStore } = useStores();
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);

  useEffect(() => {
    notebookStore.ensureProblemsLoaded();
    notebookStore.ensureNotesLoaded();
  }, [notebookStore]);

  const card = notebookStore.nextReviewCard;
  const queue = notebookStore.filteredReviewCards.slice(0, 5);
  const allTags = Array.from(
    new Set([...notebookStore.problemTags, ...notebookStore.noteTags])
  );
  const loading =
    (notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems) ||
    (notebookStore.isLoadingNotes && !notebookStore.hasLoadedNotes);

  // Reset answer revealed state when card changes
  useEffect(() => {
    if (card && card.id !== currentCardId) {
      setIsAnswerRevealed(false);
      setCurrentCardId(card.id);
    }
  }, [card, currentCardId]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Review session</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Browser spaced repetition
        </h1>
        <p className="text-sm text-muted-foreground">
          Select which notebooks and tags to focus on, then grade each card to
          keep the streak.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "problems", "notes"] as const).map((source) => (
          <Button
            key={source}
            variant={
              notebookStore.reviewSource === source ? "default" : "outline"
            }
            onClick={() => notebookStore.setReviewSource(source)}
          >
            {source === "all"
              ? "All cards"
              : source === "problems"
              ? "Problem cards"
              : "Note cards"}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <Badge
            key={tag}
            variant={
              notebookStore.reviewTagFilters.has(tag) ? "default" : "outline"
            }
            className="cursor-pointer"
            onClick={() => notebookStore.toggleReviewTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>Current card</CardTitle>
              <CardDescription>
                {card
                  ? `From ${card.sourceTitle} · due ${new Date(
                      card.due
                    ).toLocaleString()}`
                  : loading
                  ? "Loading cards…"
                  : "No cards match your filters."}
              </CardDescription>
            </div>
            {card && isAnswerRevealed && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  How is the review:
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-7 px-3"
                    onClick={() =>
                      notebookStore.gradeReviewCard(card.id, "hard")
                    }
                  >
                    Hard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-700 border-yellow-400 hover:bg-yellow-100 hover:text-yellow-800 h-7 px-3"
                    onClick={() =>
                      notebookStore.gradeReviewCard(card.id, "good")
                    }
                  >
                    Good
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 h-7 px-3"
                    onClick={() =>
                      notebookStore.gradeReviewCard(card.id, "easy")
                    }
                  >
                    Easy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingIndicator label="Preparing cards…" />
          ) : card ? (
            <div className="space-y-4">
              <div
                className={`relative min-h-[200px] cursor-pointer transition-all duration-300 ${
                  isAnswerRevealed ? "" : "hover:scale-[1.02]"
                }`}
                onClick={() => !isAnswerRevealed && setIsAnswerRevealed(true)}
              >
                {!isAnswerRevealed ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center">
                    <p className="text-lg font-semibold text-foreground mb-4">
                      {card.prompt}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to reveal answer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">
                        Prompt
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {card.prompt}
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm uppercase tracking-wide text-muted-foreground">
                        Answer
                      </p>
                      <p className="text-base text-muted-foreground">
                        {card.answer}
                      </p>
                      {card.extra ? (
                        <p className="text-sm text-muted-foreground mt-2">
                          {card.extra}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                <Badge variant="outline">
                  {card.sourceType === "problem" ? "Problem" : "Note"}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              Nothing due. Adjust filters or come back after your next capture.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Upcoming queue</CardTitle>
          <CardDescription>Top 5 cards after current filters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <LoadingIndicator label="Building queue…" /> : null}
          {queue.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-muted-foreground/10 bg-muted/40 p-4"
            >
              <p className="font-medium text-foreground line-clamp-1">
                {item.prompt}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.sourceTitle}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {queue.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">No cards queued.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
});

export default ReviewView;
