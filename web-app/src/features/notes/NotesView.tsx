import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { useStores } from "@/stores/StoreProvider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const NotesView = observer(() => {
  const { notebookStore } = useStores();
  const navigate = useNavigate();
  const { filteredNotes, noteTagFilters, noteTags, dueNoteCount } = notebookStore;

  useEffect(() => {
    notebookStore.ensureNotesLoaded();
  }, [notebookStore]);
  const loading = notebookStore.isLoadingNotes && !notebookStore.hasLoadedNotes;

  const handleStartNotesReview = () => {
    // Set review source to notes only and navigate
    notebookStore.setReviewSource("notes");
    navigate("/review");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">General notes</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Notes & Flashcards
            </h1>
            <p className="text-sm text-muted-foreground">
              Every snippet from Text → Flashcards shows up here for editing.
            </p>
          </div>
          {dueNoteCount > 0 && (
            <Button
              onClick={handleStartNotesReview}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Review {dueNoteCount} Note{dueNoteCount > 1 ? "s" : ""}
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div></div>
          <Input
            placeholder="Search notes"
            value={notebookStore.noteSearchQuery}
            onChange={(event) =>
              notebookStore.setNoteSearchQuery(event.target.value)
            }
            className="lg:w-72"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {noteTags.map((tag) => (
          <Badge
            key={tag}
            variant={noteTagFilters.has(tag) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => notebookStore.toggleNoteTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {notebookStore.notesError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {notebookStore.notesError}
        </div>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-2xl border border-border/70 bg-muted/40 p-6">
            <LoadingIndicator label="Loading notes…" />
          </div>
        ) : null}
        {filteredNotes.map((note) => (
          <Link key={note.noteId} to={`/notes/${note.noteId}`} className="block group">
            <Card className="border-border/70 hover:border-border/90 hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {note.topic ?? note.summary ?? note.url}
                  </CardTitle>
                  <CardDescription>{note.url}</CardDescription>
                </div>
                <Badge variant="outline" className="border-dashed">
                  {note.cards.length} cards
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {note.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!loading && filteredNotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            No notes match your filters yet.
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default NotesView;
