import { Badge } from "@/components/ui/badge";

interface DifficultyBadgeProps {
  difficulty: string;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const getDifficultyStyles = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Hard":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <Badge className={getDifficultyStyles(difficulty)}>
      {difficulty}
    </Badge>
  );
}