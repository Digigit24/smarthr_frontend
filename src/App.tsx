import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UniversalSidebar } from '@/components/UniversalSidebar'
import { UniversalHeader } from '@/components/UniversalHeader'
import { useAuthStore } from '@/stores/authStore'
import { notificationsService } from '@/services/notifications'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import JobsPage from '@/pages/JobsPage'
import JobDetailPage from '@/pages/JobDetailPage'
import JobCreatePage from '@/pages/JobCreatePage'
import JobEditPage from '@/pages/JobEditPage'
import ApplicationDetailPage from '@/pages/ApplicationDetailPage'
import ApplicantsPage from '@/pages/ApplicantsPage'
import ApplicantDetailPage from '@/pages/ApplicantDetailPage'
import ApplicantCreatePage from '@/pages/ApplicantCreatePage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import ApplicationCreatePage from '@/pages/ApplicationCreatePage'
import ApplicationEditPage from '@/pages/ApplicationEditPage'
import PipelinePage from '@/pages/PipelinePage'
import CallsPage from '@/pages/CallsPage'
import CallDetailPage from '@/pages/CallDetailPage'
import CallEditPage from '@/pages/CallEditPage'
import CallQueuesPage from '@/pages/CallQueuesPage'
import CallQueueDetailPage from '@/pages/CallQueueDetailPage'
import CallQueueCreatePage from '@/pages/CallQueueCreatePage'
import ScorecardsPage from '@/pages/ScorecardsPage'
import ScorecardDetailPage from '@/pages/ScorecardDetailPage'
import ScorecardEditPage from '@/pages/ScorecardEditPage'
import InterviewsPage from '@/pages/InterviewsPage'
import InterviewDetailPage from '@/pages/InterviewDetailPage'
import InterviewCreatePage from '@/pages/InterviewCreatePage'
import InterviewEditPage from '@/pages/InterviewEditPage'
import NotificationsPage from '@/pages/NotificationsPage'
import NotificationDetailPage from '@/pages/NotificationDetailPage'
import ActivitiesPage from '@/pages/ActivitiesPage'
import ActivityDetailPage from '@/pages/ActivityDetailPage'
import ProfilePage from '@/pages/ProfilePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
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
