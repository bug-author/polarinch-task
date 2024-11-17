import { Bar } from "react-chartjs-2";
import { AverageSpendCategory } from "../types";
import { toTitleCase } from "@/lib/utils";

interface AverageSpendChartProps {
  categoryData: AverageSpendCategory[];
}

export default function AverageSpendChart({
  categoryData,
}: AverageSpendChartProps) {
  // Consolidate categories
  const consolidatedData = categoryData.reduce((acc, curr) => {
    const category = toTitleCase(curr._id);
    if (acc[category]) {
      acc[category] += curr.averageSpendInCategory;
    } else {
      acc[category] = curr.averageSpendInCategory;
    }
    return acc;
  }, {} as Record<string, number>);

  const data = {
    labels: Object.keys(consolidatedData),
    datasets: [
      {
        label: "Average Spent",
        data: Object.values(consolidatedData),
        backgroundColor: "#36A2EB",
      },
    ],
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Average Spent per Category</h3>
      <Bar data={data} />
    </div>
  );
}
