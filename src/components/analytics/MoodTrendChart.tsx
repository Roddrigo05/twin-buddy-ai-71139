import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface MoodTrendData {
  date: string;
  avgIntensity: number;
  count: number;
}

interface MoodTrendChartProps {
  data: MoodTrendData[];
}

export const MoodTrendChart = ({ data }: MoodTrendChartProps) => {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "dd/MM"),
    intensity: item.avgIntensity,
    entries: item.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="date" 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          style={{ fontSize: '12px' }}
          domain={[1, 5]}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="intensity" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          name="Intensidade Média"
          dot={{ fill: "hsl(var(--primary))" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
