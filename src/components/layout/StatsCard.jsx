import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatsCard({ title, value, icon: Icon, description, trend, className, textClassName }) {
  return (
    <Card className={cn("transition-all duration-300 hover:scale-[1.02]", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className={cn("h-4 w-4 text-muted-foreground", textClassName)} />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", textClassName)}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
