import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Flame,
  NotebookPen,
  PlayCircle,
} from 'lucide-react'
import { useStores } from '@/stores/StoreProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingIndicator } from '@/components/ui/loading-indicator'

const DashboardView = observer(() => {
  const { notebookStore } = useStores()
  useEffect(() => {
    notebookStore.ensureProblemsLoaded()
    notebookStore.ensureNotesLoaded()
  }, [notebookStore])

  const stats = notebookStore.getStats()
  const loadingProblems = notebookStore.isLoadingProblems && !notebookStore.hasLoadedProblems
  const loadingNotes = notebookStore.isLoadingNotes && !notebookStore.hasLoadedNotes
  const dueProblemCount = notebookStore.dueProblemCount
  const dueNoteCount = notebookStore.dueNoteCount
  const totalDue = dueProblemCount + dueNoteCount

  const metricCards = [
    {
      title: 'Problems solved',
      value: stats.totalProblems,
      helper: `${stats.perDifficulty.Easy ?? 0} Easy · ${stats.perDifficulty.Medium ?? 0} Medium · ${stats.perDifficulty.Hard ?? 0} Hard`,
      icon: BookOpen,
      loading: loadingProblems,
    },
    {
      title: 'Day streak',
      value: stats.dayStreak,
      helper: 'Sessions logged in a row',
      icon: ClipboardList,
      loading: loadingProblems,
    },
    {
      title: 'Notes created',
      value: notebookStore.notes.length,
      helper: `${stats.flashcards} flashcards`,
      icon: NotebookPen,
      loading: loadingNotes,
    },
    {
      title: 'Due for review',
      value: totalDue,
      helper: `${dueProblemCount} problems · ${dueNoteCount} notes`,
      icon: Flame,
      loading: loadingProblems || loadingNotes,
    },
  ]

  const quickLinks = [
    {
      title: 'Browse Problems',
      description: 'View and manage your DSA problems',
      href: '/problems',
      icon: BookOpen,
    },
    {
      title: 'Study Notes',
      description: 'Review your notes and flashcards',
      href: '/notes',
      icon: NotebookPen,
    },
  ]

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-[#6F37FF] via-[#FF4F8F] to-[#FFB347] p-8 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-white/80">Your learning dashboard</p>
        <h1 className="mt-4 text-3xl font-semibold">Welcome back! 👋</h1>
        <p className="mt-2 max-w-2xl text-base text-white/80">
          Track your progress, review problems, and master algorithms one prompt at a time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge className="bg-white/15 text-white">{stats.totalProblems} problems synced</Badge>
          <Badge className="bg-white/15 text-white">{stats.flashcards} flashcards</Badge>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((metric) => (
          <Card
            key={metric.title}
            className="border-none bg-white shadow-md dark:bg-[#1c2740] dark:text-slate-100"
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm text-slate-500 dark:text-slate-300">
                  {metric.title}
                </CardTitle>
                {metric.loading ? (
                  <LoadingIndicator size="sm" />
                ) : (
                  <>
                    <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                      {metric.value}
                    </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {metric.helper}
                  </p>
                  </>
                )}
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                <metric.icon className="h-5 w-5" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl border border-dashed border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-6 shadow-sm dark:border-rose-400/30 dark:from-[#2b1f3b] dark:to-[#3a1f2a]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-rose-600">Ready for review</p>
            <p className="text-sm text-slate-600">
              You have <span className="font-semibold">{totalDue}</span> items waiting ({dueProblemCount} problems · {dueNoteCount} notes)
            </p>
          </div>
          <Button size="lg" className="bg-gradient-to-r from-rose-500 to-orange-400 text-white" asChild>
            <Link to="/review">
              <PlayCircle className="mr-2 h-4 w-4" /> Start review session
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Card
            key={link.title}
            className="border border-slate-200 bg-white shadow-sm dark:border-[#28324a] dark:bg-[#1b253d]"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-100">
                  <link.icon className="h-5 w-5" />
                </div>
                {link.title}
              </CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="link" className="px-0" asChild>
                <Link to={link.href}>
                  Explore
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
})

export default DashboardView
