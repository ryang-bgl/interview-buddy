import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "@/components/ui/markdown";
import { useStores } from "@/stores/StoreProvider";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const NoteReviewView = observer(() => {
  const { noteId } = useParams<{ noteId: string }>();
  const { notebookStore, noteDetailStore } = useStores();
  const navigate = useNavigate();
  const [cardIndex, setCardIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  useEffect(() => {
    if (noteId) {
      noteDetailStore.loadNoteDetail(noteId);
    }
    return () => {
      noteDetailStore.reset();
    };
  }, [noteId, noteDetailStore]);

  const { note, isLoading } = noteDetailStore;

  useEffect(() => {
    setCardIndex(0);
    setIsAnswerRevealed(false);
  }, [noteId]);

  // Reset answer revealed state when card changes
  useEffect(() => {
    setIsAnswerRevealed(false);
  }, [cardIndex]);

  // Use cards directly from NoteDetailStore
  const cards = note?.cards ?? [];
  const currentCard = cards[cardIndex];
  const hasNext = cardIndex < cards.length - 1;
  const hasPrevious = cardIndex > 0;

  const handleGradeAndNext = (grade: "hard" | "good" | "easy") => {
    if (!currentCard || !note) return;
    // Grade the review card using NotebookStore's review system
    const reviewCardId = `note-${note.noteId}-${currentCard.id}`;
    notebookStore.gradeReviewCard(reviewCardId, grade);

    // Move to next card after a short delay
    setTimeout(() => {
      if (hasNext) {
        setCardIndex((prev) => prev + 1);
      } else {
        // No more cards, go back to notes list
        navigate("/notes");
      }
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
        <LoadingIndicator label="Loading note review…" />
      </div>
    );
  }

  if (!note || cards.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Unable to find that note or it has no cards for review.
        </p>
        <Button variant="outline" asChild>
          <Link to="/notes">Back to notes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="link" className="w-fit px-0 text-sm" asChild>
          <Link to="/notes">← All notes</Link>
        </Button>
        <p className="text-sm text-muted-foreground">Focused review</p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            {note.topic ?? note.summary ?? note.url}
          </h1>
          {cards.length > 0 && (
            <Badge variant="outline" className="text-sm">
              {cardIndex + 1} / {cards.length} cards
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {note.tags?.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        {/* Overall progress for the note */}
        {cards.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                Session Progress
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round((cardIndex / cards.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(cardIndex / cards.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>{currentCard?.front}</CardTitle>
            </div>
            {!hasNext && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  How is the review:
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-7 px-3"
                    onClick={() => handleGradeAndNext("hard")}
                  >
                    Hard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-yellow-700 border-yellow-400 hover:bg-yellow-100 hover:text-yellow-800 h-7 px-3"
                    onClick={() => handleGradeAndNext("good")}
                  >
                    Good
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 h-7 px-3"
                    onClick={() => handleGradeAndNext("easy")}
                  >
                    Easy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <Separator />
              <div className="space-y-2">
                {isAnswerRevealed ? (
                  <Markdown content={currentCard?.back ?? ""} />
                ) : (
                  <div
                    className="rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setIsAnswerRevealed(true)}
                  >
                    <p className="text-sm text-muted-foreground">
                      Click to reveal answer
                    </p>
                  </div>
                )}
                {isAnswerRevealed && currentCard?.extra ? (
                  <>
                    <Separator />
                    <Markdown content={currentCard.extra} className="text-sm" />
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {hasPrevious && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    setCardIndex((index) => Math.max(0, index - 1))
                  }
                >
                  Previous
                </Button>
              )}
              {hasNext ? (
                <Button
                  className={`${hasPrevious ? "flex-1" : "w-full"}`}
                  onClick={() =>
                    setCardIndex((index) =>
                      Math.min(cards.length - 1, index + 1)
                    )
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  className={`${hasPrevious ? "flex-1" : "w-full"}`}
                  onClick={() => setCardIndex(0)}
                >
                  Restart review
                </Button>
              )}
            </div>
            {!hasNext && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  All cards reviewed! Return to notes list.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setCardIndex(0)}>
          Restart current note
        </Button>
        <Button variant="link" className="text-primary" asChild>
          <Link to="/review">Back to queue</Link>
        </Button>
      </div>
    </div>
  );
});

export default NoteReviewView;
