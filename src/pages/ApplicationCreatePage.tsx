import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ApplicationJobWizard from '@/components/ApplicationJobWizard'

export default function ApplicationCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">New Application</h1>
              <p className="text-sm text-muted-foreground">Create a new job application using the wizard</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ApplicationJobWizard
        onCancel={() => navigate('/applications')}
        onSuccess={(id) => navigate(`/applications/${id}`)}
      />
    </div>
  )
}
