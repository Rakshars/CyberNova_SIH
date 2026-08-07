import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SocLayout from './components/SocLayout'
import AttackerLayout from './components/AttackerLayout'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import IncidentDetail from './pages/IncidentDetail'
import Events from './pages/Events'
import Users from './pages/Users'
import UserDetail from './pages/UserDetail'
import MultiModal from './pages/MultiModal'
import SoarRules from './pages/SoarRules'
import Simulator from './pages/Simulator'
import Landing from './pages/Landing'
import Auth from './pages/Auth'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        
        <Route path="/soc" element={<SocLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="incidents/:id" element={<IncidentDetail />} />
          <Route path="events" element={<Events />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:username" element={<UserDetail />} />
          <Route path="multimodal" element={<MultiModal />} />
          <Route path="soar" element={<SoarRules />} />
        </Route>

        <Route path="/attacker" element={<AttackerLayout />}>
          <Route index element={<Simulator />} />
        </Route>

        <Route path="*" element={<Navigate to="/soc" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
