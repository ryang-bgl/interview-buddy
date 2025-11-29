import { useMemo, useState } from 'react'
import { useStores } from '@/stores/StoreProvider'
import { observer } from 'mobx-react-lite'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const devices = [
  { id: 'chrome-mac', name: 'Chrome · MacBook Pro', lastActive: '2 hours ago' },
  { id: 'extension-work', name: 'Chrome · Workstation', lastActive: 'Yesterday' },
]

const SettingsView = observer(() => {
  const { loginStore } = useStores()
  const [fullName, setFullName] = useState(loginStore.user?.user_metadata?.full_name ?? 'Candidate')
  const [timezone, setTimezone] = useState('America/Los_Angeles')
  const [model, setModel] = useState('gpt-4o-mini')
  const [language, setLanguage] = useState('English')
  const [autosync, setAutosync] = useState(true)
  const [exportState, setExportState] = useState<'idle' | 'processing' | 'done'>('idle')

  const userEmail = loginStore.user?.email ?? loginStore.email
  const exportLabel = useMemo(() => {
    if (exportState === 'processing') return 'Preparing export…'
    if (exportState === 'done') return 'Download ready in email'
    return 'Export JSON backup'
  }, [exportState])

  const handleExport = () => {
    if (exportState === 'processing') return
    setExportState('processing')
    window.setTimeout(() => setExportState('done'), 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Workspace settings</p>
        <h1 className="text-3xl font-semibold tracking-tight">Profile, devices, and support</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, connected browsers, AI defaults, and export requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update the basics that appear across the suite.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 space-y-2">
            <label className="text-sm text-muted-foreground">
              Full name
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1" />
            </label>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm text-muted-foreground">
              Email
              <Input value={userEmail} readOnly className="mt-1 bg-muted" />
            </label>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm text-muted-foreground">
              Timezone
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Singapore">Singapore</option>
              </select>
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="ml-auto" variant="outline">
            Save profile
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected browsers</CardTitle>
          <CardDescription>Manage where the Chrome extension is installed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{device.name}</p>
                <p className="text-xs text-muted-foreground">Last active {device.lastActive}</p>
              </div>
              <Button variant="ghost" size="sm">
                Disconnect
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI defaults</CardTitle>
          <CardDescription>Choose which model/language powers rewrites and flashcards.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-muted-foreground">
            Preferred model
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="gpt-4o-mini">GPT-4o mini</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="o3-mini">o3 mini</option>
            </select>
          </label>
          <label className="text-sm text-muted-foreground">
            Default language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Hindi">Hindi</option>
            </select>
          </label>
          <label className="text-sm text-muted-foreground md:col-span-2">
            Autosync cards after capture
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${autosync ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                onClick={() => setAutosync((value) => !value)}
              >
                {autosync ? 'Enabled' : 'Disabled'}
              </button>
              <span className="text-xs text-muted-foreground">
                Applies to Chrome extension captures.
              </span>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data export</CardTitle>
          <CardDescription>Request a complete export of problems, notes, and flashcards.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Exports are delivered via email.</p>
            <Badge variant="outline">Status: {exportState}</Badge>
          </div>
          <Button onClick={handleExport} disabled={exportState === 'processing'}>
            {exportLabel}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback & support</CardTitle>
          <CardDescription>Found a bug or need help with your notebook?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <a href="mailto:founders@leetstack.com">Email founders</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://ui.shadcn.com/docs/installation/vite" target="_blank" rel="noreferrer">
              View changelog
            </a>
          </Button>
          <Button>Submit feedback</Button>
        </CardContent>
      </Card>
    </div>
  )
})

export default SettingsView
