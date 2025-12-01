'use client'

import { CheckCircle2, Circle, Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type ChecklistItem = {
  id: string
  label: string
  completed: boolean
  action?: {
    type: 'link' | 'download' | 'form'
    url?: string
    label: string
  }
}

type FilingChecklistProps = {
  items: ChecklistItem[]
  title?: string
  className?: string
}

export function FilingChecklist({ 
  items, 
  title = 'Filing Checklist',
  className = '' 
}: FilingChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(items.filter(item => item.completed).map(item => item.id))
  )

  const completedCount = checkedItems.size
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedItems(newChecked)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className="text-sm text-gray-500">
            {completedCount} of {totalCount} completed
          </span>
        </div>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const isChecked = checkedItems.has(item.id)
            return (
              <div
                key={item.id}
                className={`flex items-start p-3 rounded-lg border ${
                  isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="mt-0.5 mr-3"
                  aria-pressed={isChecked}
                  aria-label={isChecked ? `Mark "${item.label}" as not completed` : `Mark "${item.label}" as completed`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <div className="flex-1">
                  <button
                    type="button"
                    className={`text-left text-sm cursor-pointer ${
                      isChecked ? 'text-green-800 line-through' : 'text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                  {item.action && (
                    <div className="mt-2">
                      {item.action.type === 'link' && item.action.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={item.action.url} target="_blank" rel="noopener">
                            {item.action.label}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {item.action.type === 'download' && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={item.action.url} download>
                            <Download className="w-3 h-3 mr-1" />
                            {item.action.label}
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

