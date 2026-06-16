import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CoachRoute, ClientRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import CoachLayout from './pages/coach/CoachLayout'
import CoachDashboard from './pages/coach/CoachDashboard'
import ClientsList from './pages/coach/ClientsList'
import CoachClientProfile from './pages/coach/CoachClientProfile'
import MealsList from './pages/coach/MealsList'
import MealEditor from './pages/coach/MealEditor'
import IngredientsLibrary from './pages/coach/IngredientsLibrary'
import WeeklyTemplatesList from './pages/coach/WeeklyTemplatesList'
import WeeklyTemplateEditor from './pages/coach/WeeklyTemplateEditor'
import GenerateTemplates from './pages/coach/GenerateTemplates'
import ClientLayout from './pages/client/ClientLayout'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientProfile from './pages/client/ClientProfile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Coach area */}
          <Route
            path="/coach"
            element={
              <CoachRoute>
                <CoachLayout />
              </CoachRoute>
            }
          >
            <Route index element={<CoachDashboard />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:clientId" element={<CoachClientProfile />} />
            <Route path="meals" element={<MealsList />} />
            <Route path="meals/new" element={<MealEditor />} />
            <Route path="meals/:mealId" element={<MealEditor />} />
            <Route path="ingredients" element={<IngredientsLibrary />} />
            <Route path="meal-templates" element={<WeeklyTemplatesList />} />
            <Route path="meal-templates/generate" element={<GenerateTemplates />} />
            <Route path="meal-templates/new" element={<WeeklyTemplateEditor />} />
            <Route path="meal-templates/:templateId" element={<WeeklyTemplateEditor />} />
          </Route>

          {/* Client area */}
          <Route
            path="/client"
            element={
              <ClientRoute>
                <ClientLayout />
              </ClientRoute>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
