import { toTitleCase } from "@/lib/utils";
import { CategorySpend } from "@/types";
import { Pie } from "react-chartjs-2";

interface CategorySpendChartProps {
  categoryData: CategorySpend[];
}

export default function CategorySpendInsights({
  categoryData,
}: CategorySpendChartProps) {
  const data = {
    labels: categoryData.map((c) => toTitleCase(c.category)),
    datasets: [
      {
        data: categoryData.map((c) => c.categorySpend),
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
          //   "rgba(153, 102, 255, 0.2)",
          //   "rgba(255, 159, 64, 0.2)",
          //   "rgba(255, 99, 132, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          //   "rgba(153, 102, 255, 1)",
          //   "rgba(255, 159, 64, 1)",
          //   "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  //   const options = {
  //     responsive: true,
  //     maintainAspectRatio: false,
  //     plugins: {
  //       legend: {
  //         display: false,
  //       },
  //     },
  //   };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4">
        Category Spent Distribution
      </h3>
      <Pie data={data} />
    </div>
  );
}
