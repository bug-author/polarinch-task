import { useCollectiveInsights } from "@/hooks/useCollectiveInsights";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import InsightsSummary from "@/components/InsightsSummary";
import CategorySpendInsights from "@/components/CategorySpendInsights";
import FrequentItemsList from "@/components/FrequentItemsList";
import AverageSpendChart from "@/components/AverageSpendChart";
import MonthlySpendTrend from "@/components/MonthlySpendChart";
import { CollectiveInsights } from "@/types";

const Dashboard = () => {
  const { data, isLoading } = useCollectiveInsights();

  if (isLoading) return <LoadingSkeleton />;

  const {
    totalSpend,
    averageSpend,
    highestSpend,
    lowestSpend,
    categorySpendDistribution,
    frequentItems,
    avgSpendPerCategory,
    monthlySpendTrend,
  } = data as CollectiveInsights;

  return (
    <div className="space-y-6 p-4 min-h-[calc(100vh-4rem)]">
      <InsightsSummary
        totalSpend={totalSpend}
        averageSpend={averageSpend}
        highestSpend={highestSpend}
        lowestSpend={lowestSpend}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <CategorySpendInsights categoryData={categorySpendDistribution} />
        <FrequentItemsList items={frequentItems} />
        <AverageSpendChart categoryData={avgSpendPerCategory} />
        <MonthlySpendTrend monthlyData={monthlySpendTrend} />
      </div>
    </div>
  );
};

export default Dashboard;
