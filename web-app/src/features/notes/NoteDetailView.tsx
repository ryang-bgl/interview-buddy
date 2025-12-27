import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStores } from "@/stores/StoreProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { PlayCircle } from "lucide-react";

const NoteDetailView = observer(() => {
  const { noteId } = useParams<{ noteId: string }>();
  const { noteDetailStore } = useStores();
  const navigate = useNavigate();

  useEffect(() => {
    if (noteId) {
      noteDetailStore.loadNoteDetail(noteId);
    }
    return () => {
      noteDetailStore.reset();
    };
  }, [noteId, noteDetailStore]);

  const { note, isLoading, error } = noteDetailStore;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
        <LoadingIndicator label="Loading note…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" asChild>
          <Link to="/notes">Back to notes</Link>
        </Button>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Note not found.</p>
        <Button variant="outline" asChild>
          <Link to="/notes">Back to notes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="link" className="w-fit px-0" asChild>
          <Link to="/notes">← Back to list</Link>
        </Button>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Note detail</p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {note.topic ?? note.summary ?? note.url}
              </h1>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                onClick={() => navigate(`/review/notes/${note.noteId}`)}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Review Note
              </Button>
            </div>
          </div>
          <a
            href={note.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline"
          >
            {note.url}
          </a>
          <div className="flex flex-wrap gap-2 mt-2">
            {note.tags?.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {note.cards.map((card, index) => (
          <Card key={card.id}>
            <CardHeader>
              <CardTitle className="text-base">Card #{index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Question
                </p>
                <Textarea
                  rows={4}
                  value={card.front}
                  onChange={(event) =>
                    noteDetailStore.updateFlashcard(card.id, {
                      front: event.target.value,
                    })
                  }
                  disabled={card.isSaving}
                  placeholder="Enter your question here"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Answer
                </p>
                <Textarea
                  rows={4}
                  value={card.back}
                  onChange={(event) =>
                    noteDetailStore.updateFlashcard(card.id, {
                      back: event.target.value,
                    })
                  }
                  disabled={card.isSaving}
                  placeholder="Enter the answer here"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Note
                </p>
                <Textarea
                  rows={3}
                  value={card.extra ?? ""}
                  onChange={(event) =>
                    noteDetailStore.updateFlashcard(card.id, {
                      extra: event.target.value,
                    })
                  }
                  disabled={card.isSaving}
                  placeholder="Additional notes or context"
                />
              </div>
              {card.saveError ? (
                <p className="text-sm text-destructive">{card.saveError}</p>
              ) : null}
              {card.hasPendingChanges ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <p className="text-sm text-muted-foreground">
                    {card.isSaving ? "Saving…" : "Unsaved changes"}
                  </p>
                  <Button
                    onClick={() => noteDetailStore.saveFlashcard(card.id)}
                    disabled={card.isSaving}
                  >
                    {card.isSaving ? "Saving…" : "Save card"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

export default NoteDetailView;
