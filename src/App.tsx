import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider, MutationCache, useQuery } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Loader2 } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UniversalSidebar } from '@/components/UniversalSidebar'
import { UniversalHeader } from '@/components/UniversalHeader'
import { useAuthStore } from '@/stores/authStore'
import { notificationsService } from '@/services/notifications'
import LoginPage from '@/pages/LoginPage'

// All page components are lazily loaded so the initial bundle stays small.
// React Router renders them inside a Suspense boundary that shows a tiny
// spinner during the first navigation to each route.
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const JobsPage = lazy(() => import('@/pages/JobsPage'))
const JobDetailPage = lazy(() => import('@/pages/JobDetailPage'))
const JobCreatePage = lazy(() => import('@/pages/JobCreatePage'))
const JobEditPage = lazy(() => import('@/pages/JobEditPage'))
const ApplicationDetailPage = lazy(() => import('@/pages/ApplicationDetailPage'))
const ApplicantsPage = lazy(() => import('@/pages/ApplicantsPage'))
const ApplicantDetailPage = lazy(() => import('@/pages/ApplicantDetailPage'))
const ApplicantCreatePage = lazy(() => import('@/pages/ApplicantCreatePage'))
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'))
const ApplicationCreatePage = lazy(() => import('@/pages/ApplicationCreatePage'))
const ApplicationEditPage = lazy(() => import('@/pages/ApplicationEditPage'))
const PipelinePage = lazy(() => import('@/pages/PipelinePage'))
const CallsPage = lazy(() => import('@/pages/CallsPage'))
const CallDetailPage = lazy(() => import('@/pages/CallDetailPage'))
const CallEditPage = lazy(() => import('@/pages/CallEditPage'))
const CallQueuesPage = lazy(() => import('@/pages/CallQueuesPage'))
const CallQueueDetailPage = lazy(() => import('@/pages/CallQueueDetailPage'))
const CallQueueCreatePage = lazy(() => import('@/pages/CallQueueCreatePage'))
const ScorecardsPage = lazy(() => import('@/pages/ScorecardsPage'))
const ScorecardDetailPage = lazy(() => import('@/pages/ScorecardDetailPage'))
const ScorecardEditPage = lazy(() => import('@/pages/ScorecardEditPage'))
const InterviewsPage = lazy(() => import('@/pages/InterviewsPage'))
const InterviewDetailPage = lazy(() => import('@/pages/InterviewDetailPage'))
const InterviewCreatePage = lazy(() => import('@/pages/InterviewCreatePage'))
const InterviewEditPage = lazy(() => import('@/pages/InterviewEditPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const NotificationDetailPage = lazy(() => import('@/pages/NotificationDetailPage'))
const ActivitiesPage = lazy(() => import('@/pages/ActivitiesPage'))
const ActivityDetailPage = lazy(() => import('@/pages/ActivityDetailPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

const ANALYTICS_QUERY_KEYS = ['analytics-dashboard', 'analytics-funnel', 'analytics-timeline', 'analytics-scores']

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      ANALYTICS_QUERY_KEYS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    },
  }),
})

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/jobs': 'Jobs',
  '/applicants': 'Applicants',
  '/applications': 'Applications',
  '/pipeline': 'Pipeline',
  '/calls': 'Call Records',
  '/call-queues': 'AI Call Queues',
  '/scorecards': 'Scorecards',
  '/interviews': 'Interviews',
  '/notifications': 'Notifications',
  '/activities': 'Activity Log',
  '/settings': 'Settings',
  '/profile': 'Profile',
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function AppLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pageTitle = PAGE_TITLES[location.pathname]
    || (location.pathname === '/jobs/new' ? 'Create Job'
    : location.pathname.match(/\/jobs\/[^/]+\/edit/) ? 'Edit Job'
    : location.pathname.match(/\/jobs\/[^/]+\/applications\//) ? 'Application Details'
    : location.pathname.startsWith('/jobs/') ? 'Job Details'
    : location.pathname === '/applicants/new' ? 'Add Applicant'
    : location.pathname.match(/\/applicants\/[^/]+/) ? 'Applicant Details'
    : location.pathname === '/applications/new' ? 'New Application'
    : location.pathname.match(/\/applications\/[^/]+\/edit/) ? 'Edit Application'
    : location.pathname.match(/\/applications\/[^/]+/) ? 'Application Details'
    : location.pathname.match(/\/calls\/[^/]+\/edit/) ? 'Edit Call'
    : location.pathname.match(/\/calls\/[^/]+/) ? 'Call Details'
    : location.pathname === '/call-queues/new' ? 'Create Call Queue'
    : location.pathname.match(/\/call-queues\/[^/]+/) ? 'Queue Details'
    : location.pathname.match(/\/scorecards\/[^/]+\/edit/) ? 'Edit Scorecard'
    : location.pathname.match(/\/scorecards\/[^/]+/) ? 'Scorecard Details'
    : location.pathname === '/interviews/new' ? 'Schedule Interview'
    : location.pathname.match(/\/interviews\/[^/]+\/edit/) ? 'Edit Interview'
    : location.pathname.match(/\/interviews\/[^/]+/) ? 'Interview Details'
    : location.pathname.match(/\/notifications\/[^/]+/) ? 'Notification Details'
    : location.pathname.match(/\/activities\/[^/]+/) ? 'Activity Details'
    : 'SmartHR-In')

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.key])

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsService.list({ is_read: 'false' }),
    refetchInterval: 60_000,
  })

  const unreadCount = notificationsData?.results?.filter((n) => !n.is_read).length ?? 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <UniversalSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <UniversalHeader
          pageTitle={pageTitle}
          onMobileMenuOpen={() => setMobileOpen(true)}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/new" element={<JobCreatePage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/jobs/:id/edit" element={<JobEditPage />} />
            <Route path="/jobs/:id/applications/:appId" element={<ApplicationDetailPage />} />
            <Route path="/applicants" element={<ApplicantsPage />} />
            <Route path="/applicants/new" element={<ApplicantCreatePage />} />
            <Route path="/applicants/:id" element={<ApplicantDetailPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/applications/new" element={<ApplicationCreatePage />} />
            <Route path="/applications/:appId" element={<ApplicationDetailPage />} />
            <Route path="/applications/:appId/edit" element={<ApplicationEditPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="/calls" element={<CallsPage />} />
            <Route path="/calls/:id" element={<CallDetailPage />} />
            <Route path="/calls/:id/edit" element={<CallEditPage />} />
            <Route path="/call-queues" element={<CallQueuesPage />} />
            <Route path="/call-queues/new" element={<CallQueueCreatePage />} />
            <Route path="/call-queues/:id" element={<CallQueueDetailPage />} />
            <Route path="/scorecards" element={<ScorecardsPage />} />
            <Route path="/scorecards/:id" element={<ScorecardDetailPage />} />
            <Route path="/scorecards/:id/edit" element={<ScorecardEditPage />} />
            <Route path="/interviews" element={<InterviewsPage />} />
            <Route path="/interviews/new" element={<InterviewCreatePage />} />
            <Route path="/interviews/:id" element={<InterviewDetailPage />} />
            <Route path="/interviews/:id/edit" element={<InterviewEditPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/notifications/:id" element={<NotificationDetailPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activities/:id" element={<ActivityDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function AuthRouter() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="bottom-right" richColors />
        <AuthRouter />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
