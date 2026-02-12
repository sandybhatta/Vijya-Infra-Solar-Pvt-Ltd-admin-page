import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Plus, Coffee, Car, Shield, Tool, MoreVertical, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useAddExpenseMutation } from '@/features/finance/financeApi'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COLORS = ['#00F3FF', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#EC4899']

const CATEGORY_ICONS = {
  Materials: Tool,
  Labor: Coffee,
  Travel: Car,
  Permits: Shield,
  Other: MoreVertical
}

export default function ProjectExpensesTab({ project }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const expenses = project.expenses || []

  const chartData = useMemo(() => {
    const categories = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'Other'
      acc[cat] = (acc[cat] || 0) + Number(exp.amount)
      return acc
    }, {})
    return Object.entries(categories).map(([name, value]) => ({ name, value }))
  }, [expenses])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      <Card className="bg-glass-bg border-glass-border lg:col-span-1">
        <CardHeader><CardTitle className="text-sm font-black uppercase text-gray-500 tracking-widest">Expense Distribution</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
          {expenses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 font-bold uppercase text-[10px]">No data available</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-glass-bg border-glass-border lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-black uppercase tracking-tight">Expense Ledger</CardTitle>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-white/5 border border-white/10 text-gray-300 font-black uppercase text-[10px]">
            <Plus className="h-3 w-3 mr-1" /> Log Expense
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase text-gray-500">Category</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-gray-500">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-gray-500">Description</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-gray-500 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp) => (
                <TableRow key={exp.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-white/5 text-neon-blue">
                         {React.createElement(CATEGORY_ICONS[exp.category] || MoreVertical, { className: "h-3.5 w-3.5" })}
                      </div>
                      <span className="font-bold text-white uppercase text-xs">{exp.category}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 font-mono text-xs">{format(new Date(exp.expense_date), 'dd MMM yy')}</TableCell>
                  <TableCell className="text-gray-500 text-xs italic truncate max-w-[150px]">{exp.description}</TableCell>
                  <TableCell className="text-right font-black text-white">${Number(exp.amount).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500 font-bold uppercase text-xs">Zero expenses logged</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddExpenseModal open={isModalOpen} setOpen={setIsModalOpen} projectId={project.id} />
    </div>
  )
}

function AddExpenseModal({ open, setOpen, projectId }) {
  const [addExpense, { isLoading }] = useAddExpenseMutation()
  const [formData, setFormData] = useState({
    category: 'Materials',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addExpense({ ...formData, project_id: projectId, status: 'approved' }).unwrap()
      toast.success("Expense added to project")
      setOpen(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-black/95 border-white/10 text-white">
        <DialogHeader><DialogTitle className="uppercase font-black italic text-orange-400">Log Project Expense</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label className="uppercase text-[10px] font-black text-gray-500">Category</Label>
            <Select defaultValue="Materials" onValueChange={val => setFormData({...formData, category: val})}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-white">
                <SelectItem value="Materials">Materials</SelectItem>
                <SelectItem value="Labor">Labor</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Permits">Permits</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="uppercase text-[10px] font-black text-gray-500">Amount ($)</Label>
            <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="bg-white/5 border-white/10" required />
          </div>
          <div className="grid gap-2">
            <Label className="uppercase text-[10px] font-black text-gray-500">Date</Label>
            <Input type="date" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} className="bg-white/5 border-white/10 [color-scheme:dark]" required />
          </div>
          <div className="grid gap-2">
            <Label className="uppercase text-[10px] font-black text-gray-500">Description</Label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10" placeholder="e.g. Extra solar panels for phase 2" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-orange-400 text-black font-black uppercase tracking-widest w-full">Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
