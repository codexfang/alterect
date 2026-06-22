import { useNavigate } from 'react-router-dom'
import { GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function DiffView() {
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-heading-sm text-ink">Diff Viewer</h1>
        <p className="text-body text-graphite mt-1">Compare drawing revisions side by side.</p>
      </div>

      <Card padding="lg">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-fog rounded-2xl flex items-center justify-center mb-4">
            <GitCompare size={24} className="text-graphite" />
          </div>
          <h3 className="text-subheading text-ink mb-1">No diffs to show</h3>
          <p className="text-body text-graphite mb-6 max-w-sm text-center">
            Upload a drawing and create a new revision to see what changed.
          </p>
          <Button onClick={() => navigate('/drawings')}>
            Go to Drawings
          </Button>
        </div>
      </Card>
    </div>
  )
}
