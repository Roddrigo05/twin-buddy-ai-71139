import { Card } from "@/components/ui/card";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
}

export const ActivityHeatmap = ({ data }: ActivityHeatmapProps) => {
  const weeks = 12;
  const startDate = addDays(new Date(), -(weeks * 7));
  const weekStart = startOfWeek(startDate, { locale: pt });

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getIntensity = (count: number): string => {
    if (count === 0) return "bg-muted";
    const ratio = count / maxCount;
    if (ratio > 0.75) return "bg-primary";
    if (ratio > 0.5) return "bg-primary/70";
    if (ratio > 0.25) return "bg-primary/40";
    return "bg-primary/20";
  };

  const getCountForDate = (date: Date): number => {
    const entry = data.find((d) => isSameDay(new Date(d.date), date));
    return entry ? entry.count : 0;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => 
    format(addDays(weekStart, i), "EEE", { locale: pt })
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-xs text-muted-foreground">
        <div className="w-8" />
        {Array.from({ length: weeks }, (_, i) => (
          <div key={i} className="flex-1 text-center">
            {format(addDays(weekStart, i * 7), "MMM", { locale: pt })}
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {weekDays.map((day) => (
            <div key={day} className="h-3 flex items-center">
              {day}
            </div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-12 gap-1">
          {Array.from({ length: weeks }, (_, weekIndex) =>
            Array.from({ length: 7 }, (_, dayIndex) => {
              const currentDate = addDays(weekStart, weekIndex * 7 + dayIndex);
              const count = getCountForDate(currentDate);
              
              return (
                <Card
                  key={`${weekIndex}-${dayIndex}`}
                  className={`h-3 w-full ${getIntensity(count)} border-0 transition-colors hover:ring-2 hover:ring-primary/50`}
                  title={`${format(currentDate, "dd/MM/yyyy")}: ${count} atividades`}
                />
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 bg-muted rounded-sm" />
          <div className="h-3 w-3 bg-primary/20 rounded-sm" />
          <div className="h-3 w-3 bg-primary/40 rounded-sm" />
          <div className="h-3 w-3 bg-primary/70 rounded-sm" />
          <div className="h-3 w-3 bg-primary rounded-sm" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  );
};
