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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const NoteDetailView = observer(() => {
  const { noteId } = useParams<{ noteId: string }>();
  const { notebookStore } = useStores();
  useEffect(() => {
    notebookStore.ensureNotesLoaded();
  }, [notebookStore]);
  const note = noteId ? notebookStore.getNoteById(noteId) : null;
  const loading = notebookStore.isLoadingNotes && !notebookStore.hasLoadedNotes;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
        <LoadingIndicator label="Loading note…" />
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
        <p className="text-sm text-muted-foreground">Note detail</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {note.topic ?? note.summary ?? note.url}
        </h1>
        <a
          href={note.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline"
        >
          {note.url}
        </a>
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {note.cards.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <CardTitle className="text-base">Flashcard</CardTitle>
              <CardDescription>
                Front, back, and tags sync with the review queue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                rows={4}
                value={card.front}
                onChange={(event) =>
                  notebookStore.updateFlashcard(note.noteId, card.id!, {
                    front: event.target.value,
                  })
                }
                placeholder="Front"
              />
              <Textarea
                rows={4}
                value={card.back}
                onChange={(event) =>
                  notebookStore.updateFlashcard(note.noteId, card.id!, {
                    back: event.target.value,
                  })
                }
                placeholder="Back"
              />
              <Textarea
                rows={3}
                value={card.extra ?? ""}
                onChange={(event) =>
                  notebookStore.updateFlashcard(note.noteId, card.id!, {
                    extra: event.target.value,
                  })
                }
                placeholder="Extra context"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

export default NoteDetailView;
