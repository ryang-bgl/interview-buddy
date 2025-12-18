import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { Search, Play } from "lucide-react";
import { useStores } from "@/stores/StoreProvider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString();
};

const ProblemsView = observer(() => {
  const { notebookStore } = useStores();
  const navigate = useNavigate();
  useEffect(() => {
    notebookStore.ensureProblemsLoaded();
  }, [notebookStore]);
  const loading =
    notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems;
  const problems = notebookStore.filteredProblems;
  const dueProblemCount = notebookStore.dueProblemCount;

  const handleStartReview = () => {
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
      // Fallback to the regular review page if no due problems
      notebookStore.setReviewSource("problems");
      navigate("/review");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              DSA Problems
            </h1>
            {dueProblemCount > 0 && (
              <Button
                onClick={handleStartReview}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Review {dueProblemCount} Due Problem{dueProblemCount > 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search problems..."
              className="rounded-2xl border-slate-200 bg-white/80 pl-11 text-slate-700 shadow-sm backdrop-blur placeholder:text-slate-400 dark:border-slate-700 dark:bg-[#111a2c] dark:text-white"
              value={notebookStore.searchQuery}
              onChange={(event) =>
                notebookStore.setSearchQuery(event.target.value)
              }
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#111a2c] dark:text-slate-200">
              <select
                value={notebookStore.difficultyFilter}
                onChange={(event) =>
                  notebookStore.setDifficultyFilter(event.target.value as any)
                }
                className="h-full w-full appearance-none border-none bg-transparent text-sm focus:outline-none"
              >
                <option value="All">All</option>
                <option value="Easy">Easy</option>
                <option value="Good">Good</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#28324a] dark:bg-[#1b253d]">
          <LoadingIndicator label="Loading problems…" />
        </div>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => {
            const mastery = notebookStore.getProblemMastery(problem.id);
            const nextReview = notebookStore.getProblemNextReviewDate(
              problem.id
            );
            const reviewCount = notebookStore.getProblemReviewCount(problem.id);
            return (
              <Link
                key={problem.id}
                to={`/problems/${problem.id}`}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-[#28324a] dark:bg-[#1b253d]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      #{problem.questionIndex}
                    </p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {problem.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <DifficultyBadge difficulty={problem.difficulty} />
                      {(problem.tags ?? []).slice(0, 4).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-slate-200 text-slate-500"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(problem.tags ?? []).length > 4 ? (
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-500"
                        >
                          +{(problem.tags ?? []).length - 4}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Next: {formatDate(nextReview)}</span>
                      <span>{reviewCount} reviews</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                      {mastery}%
                    </p>
                    <p className="text-xs text-slate-500">Mastery</p>
                  </div>
                </div>
              </Link>
            );
          })}
          {problems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              No problems match your filters yet.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});

export default ProblemsView;
