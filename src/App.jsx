import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CoachRoute, ClientRoute } from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import CoachLayout from './pages/coach/CoachLayout'
import ClientLayout from './pages/client/ClientLayout'

// Everything below is only fetched once the matching route is actually visited, instead of all
// being bundled into one multi-megabyte file every user downloads just to see the login screen.
const CoachDashboard = lazy(() => import('./pages/coach/CoachDashboard'))
const ClientsList = lazy(() => import('./pages/coach/ClientsList'))
const CoachClientProfile = lazy(() => import('./pages/coach/CoachClientProfile'))
const MealsList = lazy(() => import('./pages/coach/MealsList'))
const MealEditor = lazy(() => import('./pages/coach/MealEditor'))
const IngredientsLibrary = lazy(() => import('./pages/coach/IngredientsLibrary'))
const WeeklyTemplatesList = lazy(() => import('./pages/coach/WeeklyTemplatesList'))
const GenerateTemplates = lazy(() => import('./pages/coach/GenerateTemplates'))
const PlanGroupEditor = lazy(() => import('./pages/coach/PlanGroupEditor'))
const CoachSettings = lazy(() => import('./pages/coach/CoachSettings'))
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'))
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'))
const ClientMealPlan = lazy(() => import('./pages/client/ClientMealPlan'))
const ClientShoppingList = lazy(() => import('./pages/client/ClientShoppingList'))
const ClientCheckin = lazy(() => import('./pages/client/ClientCheckin'))
const ClientProgress = lazy(() => import('./pages/client/ClientProgress'))
const CoachReports = lazy(() => import('./pages/coach/CoachReports'))
const CoachTrainingList = lazy(() => import('./pages/coach/CoachTrainingList'))
const CoachTrainingEditor = lazy(() => import('./pages/coach/CoachTrainingEditor'))
const CoachCheckins = lazy(() => import('./pages/coach/CoachCheckins'))
const CoachMessages = lazy(() => import('./pages/coach/CoachMessages'))
const ExerciseLibrary = lazy(() => import('./pages/coach/ExerciseLibrary'))
const WorkoutEditor = lazy(() => import('./pages/coach/WorkoutEditor'))
const CardioLibrary = lazy(() => import('./pages/coach/CardioLibrary'))
const HiitLibrary = lazy(() => import('./pages/coach/HiitLibrary'))
const ClientTraining = lazy(() => import('./pages/client/ClientTraining'))
const ClientMessages = lazy(() => import('./pages/client/ClientMessages'))
const ClientTodoList = lazy(() => import('./pages/client/ClientTodoList'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/set-password" element={<SetPassword />} />

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
              <Route path="settings" element={<CoachSettings />} />
              <Route path="reports" element={<CoachReports />} />
              <Route path="training" element={<CoachTrainingList />} />
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
              <Route path="shopping-list" element={<ClientShoppingList />} />
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
