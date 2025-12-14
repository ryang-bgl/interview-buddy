import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  NotebookPen,
  PlayCircle,
  Code,
  FileText,
  Activity,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useStores } from "@/stores/StoreProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyStateSplash } from "@/components/dashboard/EmptyStateSplash";

const DashboardView = observer(() => {
  const { notebookStore } = useStores();
  const navigate = useNavigate();

  useEffect(() => {
    notebookStore.ensureProblemsLoaded();
    notebookStore.ensureNotesLoaded();
  }, [notebookStore]);

  const handleStartProblemsReview = () => {
    // Get all due problems and sort by due date (oldest first)
    const now = Date.now();
    const dueProblems = notebookStore.reviewCardList
      .filter(
        (card) =>
          card.sourceType === "problem" && new Date(card.due).getTime() <= now
      )
      .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

    if (dueProblems.length > 0) {
      // Navigate to the first problem's detailed review view
      navigate(`/review/problems/${dueProblems[0].sourceId}`);
    } else {
      // Fallback to the regular review page with problems filter
      notebookStore.setReviewSource("problems");
      navigate("/review");
    }
  };

  const handleStartNotesReview = () => {
    // Set review source to notes only and navigate
    notebookStore.setReviewSource("notes");
    navigate("/review");
  };

  const stats = notebookStore.getStats();
  const loadingProblems =
    notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems;
  const loadingNotes =
    notebookStore.isLoadingNotes && !notebookStore.hasLoadedNotes;
  const dueProblemCount = notebookStore.dueProblemCount;
  const dueNoteCount = notebookStore.dueNoteCount;
  const totalDue = dueProblemCount + dueNoteCount;

  // Check if both DSA questions and notes are empty/null
  const hasData =
    notebookStore.hasLoadedProblems && notebookStore.hasLoadedNotes;
  const hasNoContent =
    hasData &&
    notebookStore.problems.length === 0 &&
    notebookStore.notes.length === 0;

  const handleRefreshData = () => {
    notebookStore.refreshAll(true);
  };

  const metricCards = [
    {
      title: "Problems Solved",
      value: stats.totalProblems,
      helper: `${stats.perDifficulty.Easy ?? 0} Easy · ${
        stats.perDifficulty.Medium ?? 0
      } Medium · ${stats.perDifficulty.Hard ?? 0} Hard`,
      icon: Code,
      loading: loadingProblems,
    },
    {
      title: "Due for Review",
      value: totalDue,
      helper: `${dueProblemCount} problems · ${dueNoteCount} notes`,
      icon: Activity,
      loading: loadingProblems || loadingNotes,
    },
    {
      title: "Notes Created",
      value: notebookStore.notes.length,
      helper: `${stats.flashcards} flashcards`,
      icon: FileText,
      loading: loadingNotes,
    },
    {
      title: "Day Streak",
      value: stats.dayStreak,
      helper: "Sessions logged in a row",
      icon: TrendingUp,
      loading: loadingProblems,
    },
  ];

  const quickLinks = [
    {
      title: "Browse Problems",
      description: "View and manage your DSA problems",
      href: "/problems",
      icon: BookOpen,
    },
    {
      title: "Study Notes",
      description: "Review your notes and flashcards",
      href: "/notes",
      icon: NotebookPen,
    },
  ];

  // Show splash screen if both DSA questions and notes are empty/null
  if (hasNoContent) {
    return <EmptyStateSplash onGetStarted={handleRefreshData} />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <Card
            key={metric.title}
            className="hover:shadow-md transition-all duration-200 interactive-hover"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <metric.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {metric.loading ? (
                <div className="text-center py-4">
                  <div className="inline-block h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {metric.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.helper}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Ready for Review
              </h2>
              <p className="text-sm text-muted-foreground">
                You have{" "}
                <span className="font-medium text-foreground">{totalDue}</span>{" "}
                items waiting ({dueProblemCount} problems · {dueNoteCount}{" "}
                notes)
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-800/50">
                    <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      DSA Problems
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dueProblemCount} problem
                      {dueProblemCount !== 1 ? "s" : ""} due for review
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {dueProblemCount}
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleStartProblemsReview}
                disabled={dueProblemCount === 0}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Review Problems
              </Button>
            </Card>

            <Card className="p-4 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-800/50">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100">
                      Notes
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dueNoteCount} note{dueNoteCount !== 1 ? "s" : ""} due for
                      review
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {dueNoteCount}
                </div>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleStartNotesReview}
                disabled={dueNoteCount === 0}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Review Notes
              </Button>
            </Card>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Card
            key={link.title}
            className="hover:shadow-md transition-all duration-200 cursor-pointer interactive-hover"
            onClick={() => navigate(link.href)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <link.icon className="h-5 w-4 text-primary" />
                </div>
                {link.title}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {link.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-muted px-0"
              >
                Explore
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
});

export default DashboardView;
