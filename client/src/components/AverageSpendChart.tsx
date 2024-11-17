import { Bar } from "react-chartjs-2";
import { AverageSpendCategory } from "../types";
import { toTitleCase } from "@/lib/utils";

interface AverageSpendChartProps {
  categoryData: AverageSpendCategory[];
}

export default function AverageSpendChart({
  categoryData,
}: AverageSpendChartProps) {
  const data = {
    labels: categoryData.map((c) => toTitleCase(c._id)),
    datasets: [
      {
        label: "Average Spent",
        data: categoryData.map((c) => c.averageSpendInCategory),
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
