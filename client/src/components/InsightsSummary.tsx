import { Card } from "./ui";

interface InsightsSummaryProps {
  totalSpend: number;
  averageSpend: number;
  highestSpend: number;
  lowestSpend: number;
}

export default function InsightsSummary({
  totalSpend,
  averageSpend,
  highestSpend,
  lowestSpend,
}: InsightsSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[
        ["Total Spent", totalSpend],
        ["Average Spent", averageSpend],
        ["Highest Spent", highestSpend],
        ["Lowest Spent", lowestSpend],
      ].map(([title, value]) => (
        <Card
          key={title}
          className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg"
        >
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-2xl font-bold">£{(value as number).toFixed(2)}</p>
        </Card>
      ))}
    </div>
  );
}
