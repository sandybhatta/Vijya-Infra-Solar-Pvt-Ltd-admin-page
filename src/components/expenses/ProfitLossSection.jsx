import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0)
}

export default function ProfitLossSection({ profitLossData, isLoading }) {
  if (isLoading || !profitLossData) {
    return null
  }

  const { totalRevenue, totalExpenses, netProfit, profitMargin, monthlyData } = profitLossData

  const isProfit = netProfit >= 0

  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-black text-white">
        💰 Profit & Loss Overview
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Revenue</p>
            <p className="text-lg md:text-2xl font-black text-green-400">
              {formatCurrency(totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="h-4 w-4 text-red-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Expenses</p>
            <p className="text-lg md:text-2xl font-black text-red-400">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-white/5 border-white/10 ${isProfit ? 'ring-2 ring-green-500/30' : 'ring-2 ring-red-500/30'}`}>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {isProfit ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Net Profit/Loss</p>
            <p className={`text-lg md:text-2xl font-black ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(netProfit)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${isProfit ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
                <Percent className={`h-4 w-4 ${isProfit ? 'text-blue-400' : 'text-orange-400'}`} />
              </div>
            </div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Profit Margin</p>
            <p className={`text-lg md:text-2xl font-black ${isProfit ? 'text-blue-400' : 'text-orange-400'}`}>
              {profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Comparison Chart */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-bold text-white">
            Monthly Comparison (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue">
                <LabelList dataKey="revenue" position="top" fill="#10b981" fontSize={10} formatter={(v) => v > 0 ? `${(v/1000).toFixed(0)}k` : ''} />
              </Bar>
              <Bar dataKey="expense" fill="#ef4444" name="Expense">
                <LabelList dataKey="expense" position="top" fill="#ef4444" fontSize={10} formatter={(v) => v > 0 ? `${(v/1000).toFixed(0)}k` : ''} />
              </Bar>
              <Bar dataKey="profit" fill="#3b82f6" name="Profit">
                <LabelList dataKey="profit" position="top" fill="#3b82f6" fontSize={10} formatter={(v) => `${(v/1000).toFixed(0)}k`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
