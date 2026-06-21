import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChangeList } from './ChangeList'
import type { Trade } from '@/lib/utils'

interface DiffViewerProps {
  oldImage?: string
  newImage?: string
  sheetName: string
  changes: any[]
}

export function DiffViewer({ oldImage, newImage, sheetName, changes }: DiffViewerProps) {
  const [activeChangeId, setActiveChangeId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-sm text-ink">{sheetName}</h3>
          <p className="text-body text-graphite">{changes.length} changes detected</p>
        </div>
        <div className="flex gap-1 bg-fog rounded-[12px] p-0.5">
          <button
            onClick={() => setViewMode('side-by-side')}
            className={cn(
              'px-3 py-1.5 text-[13px] rounded-[10px] transition-all',
              viewMode === 'side-by-side' ? 'bg-white shadow-subtle text-ink' : 'text-graphite hover:text-ink'
            )}
          >
            Side by side
          </button>
          <button
            onClick={() => setViewMode('overlay')}
            className={cn(
              'px-3 py-1.5 text-[13px] rounded-[10px] transition-all',
              viewMode === 'overlay' ? 'bg-white shadow-subtle text-ink' : 'text-graphite hover:text-ink'
            )}
          >
            Overlay
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className={cn('grid gap-4', viewMode === 'side-by-side' ? 'grid-cols-2' : 'grid-cols-1')}>
        {/* Old Drawing */}
        <div className="bg-fog rounded-[24px] overflow-hidden border border-dove/10">
          <div className="px-4 py-2 border-b border-dove/10 flex items-center justify-between">
            <span className="text-caption text-graphite">Previous (Rev 3)</span>
            <span className="text-[11px] text-rust bg-rust/10 px-2 py-0.5 rounded-full">Removed</span>
          </div>
          <div className="aspect-[4/3] bg-white/50 flex items-center justify-center relative">
            {oldImage ? (
              <img src={oldImage} alt="Previous revision" className="w-full h-full object-contain" />
            ) : (
              <span className="text-graphite text-body">Previous revision preview</span>
            )}
            {/* Simulated change highlights */}
            <div className="absolute top-[30%] left-[25%] w-16 h-4 border-2 border-red-500 rounded opacity-70" />
            <div className="absolute top-[55%] left-[40%] w-8 h-8 border-2 border-orange-400 rounded-full opacity-70" />
          </div>
        </div>

        {/* New Drawing */}
        <div className="bg-fog rounded-[24px] overflow-hidden border border-dove/10">
          <div className="px-4 py-2 border-b border-dove/10 flex items-center justify-between">
            <span className="text-caption text-graphite">Current (Rev 4)</span>
            <span className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Added</span>
          </div>
          <div className="aspect-[4/3] bg-white/50 flex items-center justify-center relative">
            {newImage ? (
              <img src={newImage} alt="New revision" className="w-full h-full object-contain" />
            ) : (
              <span className="text-graphite text-body">Current revision preview</span>
            )}
            <div className="absolute top-[30%] left-[25%] w-16 h-4 border-2 border-green-500 rounded opacity-70" />
            <div className="absolute top-[55%] left-[42%] w-8 h-8 border-2 border-green-500 rounded-full opacity-70" />
            <div className="absolute top-[20%] left-[60%] w-12 h-3 border-2 border-orange-400 rounded opacity-70" />
          </div>
        </div>
      </div>

      {/* Change List Sidebar */}
      <div className="bg-fog rounded-[24px] p-4">
        <h4 className="text-subheading text-ink mb-3">Detected Changes</h4>
        <ChangeList
          changes={changes}
          activeChangeId={activeChangeId}
          onSelect={setActiveChangeId}
        />
      </div>
    </div>
  )
}
