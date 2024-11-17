import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { MonthlySpend } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface MonthlySpendTrendProps {
  monthlyData: MonthlySpend[];
}

export default function MonthlySpendTrend({
  monthlyData,
}: MonthlySpendTrendProps) {
  const data = {
    labels: monthlyData.map((m) => `${m._id.month}/${m._id.year}`),
    datasets: [
      {
        label: "Monthly Spent",
        data: monthlyData.map((m) => m.monthlySpend),
        fill: false,
        borderColor: "#FF6384",
      },
    ],
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Monthly Spend Trent</h3>
      <Line data={data} />
    </div>
  );
}
