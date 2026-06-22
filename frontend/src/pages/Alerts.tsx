import { useState } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default function Alerts() {
  const [loading] = useState(false)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-heading-sm text-ink">Alerts</h1>
          <p className="text-body text-graphite mt-1">Notifications about changes in your drawings.</p>
        </div>
        <Card padding="lg">
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-graphite animate-spin" />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-heading-sm text-ink">Alerts</h1>
        <p className="text-body text-graphite mt-1">No alerts yet. Alerts will appear here when changes are detected in your drawings.</p>
      </div>

      <Card padding="lg">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mb-4">
            <Bell size={24} className="text-graphite" />
          </div>
          <h3 className="text-subheading text-ink mb-1">All clear</h3>
          <p className="text-body text-graphite max-w-sm text-center">
            You will be notified here when a revision is uploaded and changes are detected against previous versions.
          </p>
        </div>
      </Card>
    </div>
  )
}
