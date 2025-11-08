export const MOOD_COLORS: Record<string, string> = {
  feliz: "hsl(142, 76%, 36%)",
  muito_feliz: "hsl(142, 86%, 46%)",
  neutro: "hsl(43, 96%, 56%)",
  triste: "hsl(221, 83%, 53%)",
  muito_triste: "hsl(217, 91%, 60%)",
  ansioso: "hsl(271, 91%, 65%)",
  calmo: "hsl(173, 80%, 40%)",
  irritado: "hsl(0, 84%, 60%)",
  animado: "hsl(24, 95%, 53%)",
  cansado: "hsl(210, 40%, 50%)",
};

export const MOOD_LABELS: Record<string, string> = {
  feliz: "Feliz",
  muito_feliz: "Muito Feliz",
  neutro: "Neutro",
  triste: "Triste",
  muito_triste: "Muito Triste",
  ansioso: "Ansioso",
  calmo: "Calmo",
  irritado: "Irritado",
  animado: "Animado",
  cansado: "Cansado",
};

export const getMoodColor = (mood: string): string => {
  return MOOD_COLORS[mood] || "hsl(var(--muted))";
};

export const getMoodLabel = (mood: string): string => {
  return MOOD_LABELS[mood] || mood;
};
