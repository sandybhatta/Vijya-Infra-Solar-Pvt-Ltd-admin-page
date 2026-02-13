import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react'

export default function LowStockAlertPanel({ lowStockItems }) {
  if (!lowStockItems || lowStockItems.length === 0) return null

  return (
    <Card className="bg-red-500/5 border-red-500/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Reorder Alerts
        </CardTitle>
        <Badge variant="destructive">{lowStockItems.length} Items Low</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockItems.map((item) => {
            const needed = Number(item.reorder_level || 0) - Number(item.quantity_available || 0)
            const estCost = needed * Number(item.materials?.unit_cost || 0)
            
            return (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 gap-3">
                <div>
                  <h4 className="font-bold text-white">{item.materials?.name}</h4>
                  <p className="text-xs text-gray-400">
                    Current: <span className="text-red-400 font-bold">{item.quantity_available}</span> / Reorder Level: {item.reorder_level}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold">Est. Cost</p>
                    <p className="text-sm font-black text-white">₹{estCost.toLocaleString('en-IN')}</p>
                  </div>
                  <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white font-bold h-8">
                    <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                    Quick Reorder
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function Badge({ children, variant }) {
  const styles = variant === 'destructive' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black border ${styles}`}>
      {children}
    </span>
  )
}
