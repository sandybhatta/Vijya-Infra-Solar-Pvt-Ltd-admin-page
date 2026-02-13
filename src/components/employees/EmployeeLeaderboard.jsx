import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { subDays, isAfter } from 'date-fns'
import { Trophy, ArrowUpRight } from 'lucide-react'

export default function EmployeeLeaderboard({ employees = [], tasks = [] }) {
  const thirtyDaysAgo = subDays(new Date(), 30)

  const leaderboard = employees.map(emp => {
    const empTasks = tasks.filter(t => t.employee_id === emp.id)
    const completedLast30 = empTasks.filter(t => 
      t.task_status === 'done' && 
      t.completed_date && 
      isAfter(new Date(t.completed_date), thirtyDaysAgo)
    )
    const pending = empTasks.filter(t => t.task_status === 'pending').length
    const rate = empTasks.length > 0 ? (empTasks.filter(t => t.task_status === 'done').length / empTasks.length * 100).toFixed(1) : 0
    
    // Last completed date
    const lastDoneTask = empTasks
      .filter(t => t.task_status === 'done' && t.completed_date)
      .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))[0]

    return {
      ...emp,
      tasksDone30: completedLast30.length,
      pending,
      rate,
      lastDone: lastDoneTask ? lastDoneTask.completed_date : 'No tasks'
    }
  }).sort((a, b) => b.tasksDone30 - a.tasksDone30 || b.rate - a.rate).slice(0, 5)

  return (
    <Card className="border-none bg-white/5 backdrop-blur-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Productivity Leaderboard (30d)</h3>
        </div>

        <div className="space-y-4">
          {leaderboard.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {index === 0 && <div className="absolute -top-1 -right-1 bg-yellow-500 text-[8px] font-black rounded-full px-1 py-0.5 text-black">🏆</div>}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{item.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{item.role}</p>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-400">Completion</p>
                  <Badge variant="outline" className="border-neon-blue/30 text-neon-blue text-[10px] mt-0.5">
                    {item.rate}%
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Tasks Done</p>
                  <p className="text-sm font-black text-white flex items-center justify-end gap-1">
                    {item.tasksDone30} <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
