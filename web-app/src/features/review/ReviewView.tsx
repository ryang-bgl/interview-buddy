import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
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
import { Play, ArrowRight } from "lucide-react";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const ReviewView = observer(() => {
  const { notebookStore } = useStores();
  const navigate = useNavigate();

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

  // Function to handle starting a review for the current card
  const handleStartReview = () => {
    if (!card) return;

    if (card.sourceType === "problem") {
      navigate(`/review/problems/${card.sourceId}`);
    } else if (card.sourceType === "note") {
      navigate(`/review/notes/${card.sourceId}`);
    }
  };

  // Function to handle starting review for a specific card in the queue
  const handleQueueCardClick = (queueCard: any) => {
    if (queueCard.sourceType === "problem") {
      navigate(`/review/problems/${queueCard.sourceId}`);
    } else if (queueCard.sourceType === "note") {
      navigate(`/review/notes/${queueCard.sourceId}`);
    }
  };

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
              <CardTitle>Next card to review</CardTitle>
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
            {card && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {card.sourceType === "problem" ? "DSA Problem" : "General Note"}
                </Badge>
                {card.streak !== undefined && (
                  <Badge variant="secondary">
                    {card.streak} streak
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingIndicator label="Preparing cards…" />
          ) : card ? (
            <div className="space-y-4">
              {/* Card Preview */}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                      {card.prompt}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {card.sourceType === "problem" ? "Problem" : "Note"}
                      </Badge>
                      {card.tags.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {card.tags[0]}
                          {card.tags.length > 1 && ` +${card.tags.length - 1}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleStartReview}
                    className="shrink-0"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>Due:</span>
                  <span className="font-medium">
                    {new Date(card.due).toLocaleDateString()}
                  </span>
                </div>
                {card.streak !== undefined && (
                  <div className="flex items-center gap-1">
                    <span>Streak:</span>
                    <span className="font-medium">{card.streak} correct</span>
                  </div>
                )}
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
              className="rounded-2xl border border-muted-foreground/10 bg-muted/40 p-4 hover:bg-muted/60 transition-colors cursor-pointer group"
              onClick={() => handleQueueCardClick(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground line-clamp-1 mb-1">
                    {item.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.sourceTitle}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.sourceType === "problem" ? "DSA Problem" : "General Note"}
                    </Badge>
                    {item.streak !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {item.streak} streak
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Due: {new Date(item.due).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
