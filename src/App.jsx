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
import PlanGroupEditor from './pages/coach/PlanGroupEditor'
import CoachSettings from './pages/coach/CoachSettings'
import ClientLayout from './pages/client/ClientLayout'
import ClientDashboard from './pages/client/ClientDashboard'
import ClientProfile from './pages/client/ClientProfile'
import ClientMealPlan from './pages/client/ClientMealPlan'
import ClientCheckin from './pages/client/ClientCheckin'
import ClientProgress from './pages/client/ClientProgress'
import CoachReports from './pages/coach/CoachReports'
import CoachTrainingList from './pages/coach/CoachTrainingList'
import TrainingHub from './pages/coach/TrainingHub'
import CoachTrainingEditor from './pages/coach/CoachTrainingEditor'
import CoachCheckins from './pages/coach/CoachCheckins'
import CoachMessages from './pages/coach/CoachMessages'
import ExerciseLibrary from './pages/coach/ExerciseLibrary'
import WorkoutLibrary from './pages/coach/WorkoutLibrary'
import WorkoutEditor from './pages/coach/WorkoutEditor'
import CardioLibrary from './pages/coach/CardioLibrary'
import HiitLibrary from './pages/coach/HiitLibrary'
import ClientTraining from './pages/client/ClientTraining'
import ClientMessages from './pages/client/ClientMessages'
import ClientTodoList from './pages/client/ClientTodoList'

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
            <Route path="meal-templates/plans/:groupId" element={<PlanGroupEditor />} />
            <Route path="meal-templates/new" element={<WeeklyTemplateEditor />} />
            <Route path="meal-templates/:templateId" element={<WeeklyTemplateEditor />} />
            <Route path="settings" element={<CoachSettings />} />
            <Route path="reports" element={<CoachReports />} />
            <Route path="training" element={<TrainingHub />} />
            <Route path="training/:programId" element={<CoachTrainingEditor />} />
            <Route path="exercises" element={<ExerciseLibrary />} />
            <Route path="workouts" element={<Navigate to="/coach/training" replace />} />
            <Route path="workouts/:workoutId" element={<WorkoutEditor />} />
            <Route path="cardio" element={<CardioLibrary />} />
            <Route path="hiit" element={<HiitLibrary />} />
            <Route path="checkins" element={<CoachCheckins />} />
            <Route path="messages" element={<CoachMessages />} />
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
            <Route path="meals" element={<ClientMealPlan />} />
            <Route path="checkin" element={<ClientCheckin />} />
            <Route path="progress" element={<ClientProgress />} />
            <Route path="training" element={<ClientTraining />} />
            <Route path="messages" element={<ClientMessages />} />
            <Route path="todos" element={<ClientTodoList />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
