import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { getMoodColor, getMoodLabel } from "@/lib/mood-utils";

interface MoodData {
  mood: string;
  count: number;
}

interface MoodBarChartProps {
  data: MoodData[];
}

export const MoodBarChart = ({ data }: MoodBarChartProps) => {
  const chartData = data
    .map((item) => ({
      mood: getMoodLabel(item.mood),
      count: item.count,
      fill: getMoodColor(item.mood),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="mood" 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Bar 
          dataKey="count" 
          name="Número de Registos"
          radius={[8, 8, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
