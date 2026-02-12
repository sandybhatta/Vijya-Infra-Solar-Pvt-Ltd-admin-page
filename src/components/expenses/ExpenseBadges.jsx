import React from 'react'
import { Badge } from '@/components/ui/badge'

export function ExpenseCategoryBadge({ category }) {
  return (
    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs font-bold">
      {category || 'Uncategorized'}
    </Badge>
  )
}

export function ExpenseTypeBadge({ isProjectExpense }) {
  return isProjectExpense ? (
    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs font-bold">
      Project
    </Badge>
  ) : (
    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs font-bold">
      General
    </Badge>
  )
}
