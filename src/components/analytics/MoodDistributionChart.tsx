import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { getMoodColor, getMoodLabel } from "@/lib/mood-utils";

interface MoodData {
  mood: string;
  count: number;
}

interface MoodDistributionChartProps {
  data: MoodData[];
}

export const MoodDistributionChart = ({ data }: MoodDistributionChartProps) => {
  const chartData = data.map((item) => ({
    name: getMoodLabel(item.mood),
    value: item.count,
    color: getMoodColor(item.mood),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="hsl(var(--primary))"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
