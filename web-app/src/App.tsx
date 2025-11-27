import { Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import LoginView from '@/views/LoginView'
import DashboardView from '@/views/DashboardView'
import { useStores } from '@/stores/StoreProvider'

const ProtectedShell = observer(() => {
  const { loginStore } = useStores()
  if (!loginStore.isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
})

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route element={<ProtectedShell />}>
        <Route path="/" element={<DashboardView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
