import { observer } from 'mobx-react-lite'
import { ArrowUpRight, Chrome, NotebookPen, Sparkles, Target, Timer } from 'lucide-react'
import { useStores } from '@/stores/StoreProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const timelinePlaceholders = [
  {
    title: 'Mock interview: Binary Trees',
    meta: 'Captured from Chrome extension',
    tags: ['Recursion', 'DFS'],
  },
  {
    title: 'Daily drill: Sliding Window',
    meta: 'Notes syncing shortly',
    tags: ['Arrays', 'Optimizations'],
  },
  {
    title: 'Systems design refresher',
    meta: 'Notebook outline',
    tags: ['APIs', 'Scaling'],
  },
]

const stats = [
  {
    label: 'Problems captured',
    value: '—',
    helper: 'Syncing soon',
  },
  {
    label: 'Patterns starred',
    value: '—',
    helper: 'Coming online',
  },
  {
    label: 'Practice streak',
    value: '0 days',
    helper: 'Start a session today',
  },
]

const quickActions = [
  {
    icon: Chrome,
    title: 'Open the Chrome extension',
    description: 'Capture a prompt, snippet, or post-mortem in seconds.',
    action: 'Launch popup',
  },
  {
    icon: NotebookPen,
    title: 'Create a manual entry',
    description: 'Log insights that were not captured yet.',
    action: 'Draft note',
  },
]

const DashboardView = observer(() => {
  const { loginStore } = useStores()
  const email = loginStore.user?.email ?? loginStore.email

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-12">
        <header className="space-y-4">
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            DSA Notebook · Beta
          </Badge>
          <div className="flex flex-col gap-6 rounded-3xl border border-border/80 bg-background/90 p-6 shadow-sm shadow-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {email ? `Signed in as ${email}` : 'Signed in'}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Good to see you. Your notebook is syncing.
              </h1>
              <p className="text-base text-muted-foreground">
                Capture prompts from the Chrome extension, then review insights and
                plan your next deep work session here.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="gap-2">
                <Chrome className="h-4 w-4" />
                Open extension
              </Button>
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" />
                Log new pattern
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-dashed">
              <CardHeader className="space-y-2">
                <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
                <p className="text-sm text-muted-foreground">{stat.helper}</p>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border/80">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Unified timeline</CardTitle>
                <CardDescription>Recently captured problems appear here.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-sm">
                View archive
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelinePlaceholders.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.meta}</p>
                    </div>
                    <Badge variant="outline" className="border-dashed">
                      Sync pending
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
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
              <CardDescription>Plan your next block of focused reps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-muted-foreground/10 bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Timer className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Suggested block</p>
                    <p className="text-xs text-muted-foreground">45 min • Hard difficulty</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-muted-foreground/10 bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Focus pattern</p>
                    <p className="text-xs text-muted-foreground">Graph traversal & heuristics</p>
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
          {quickActions.map((action) => (
            <Card key={action.title} className="border-border/80">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <action.icon className="h-4 w-4 text-primary" />
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
                <Badge variant="outline" className="border-dashed">
                  Ready soon
                </Badge>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="gap-2">
                  {action.action}
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  )
})

export default DashboardView
