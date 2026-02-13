import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import Invoices from './pages/Invoices'
import Payments from './pages/Payments'
import Expenses from './pages/Expenses'
import Inventory from './pages/Inventory'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Admins from './pages/Admins'
import LeadSources from './pages/LeadSources'
import Campaigns from './pages/Campaigns'
import Quotations from './pages/Quotations'
import Employees from './pages/Employees'
import Tasks from './pages/Tasks'
import LeadDetails from './pages/LeadDetails'
import LeadStatusHistory from './pages/LeadStatusHistory'
import ActivityLogs from './pages/ActivityLogs'
import Reports from './pages/Reports' // Added
import Users from './pages/Users' // Added
import Materials from './pages/Materials'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'bg-glass-bg border border-glass-border text-white shadow-[0_0_15px_rgba(0,243,255,0.2)] backdrop-blur-md',
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#00f3ff', // Neon Blue
              secondary: 'black',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff0055', // Neon Red/Pink
              secondary: 'white',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'sales', 'technician']} />}>
            <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/leads/:id" element={<LeadDetails />} />
                <Route path="/lead-status-history" element={<LeadStatusHistory />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/lead-sources" element={<LeadSources />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/activity-logs" element={<ActivityLogs />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/materials" element={<Materials />} />
                
                {/* Admin Only Route */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admins" element={<Admins />} />
                </Route>
            </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
