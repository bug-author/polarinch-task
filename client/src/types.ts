export interface Item {
  item: string;
  quantity: string;
  price: number;
  category: string;
}

export interface Receipt {
  fileName: string;
  date: string;
  total: number;
  items: Item[];
  insights: string[];
}

export interface FrequentItem {
  _id: string;
  frequency: number;
}

export interface CategorySpend {
  category: string;
  categorySpend: number;
  spendPercentage: number;
}

export interface AverageSpendCategory {
  _id: string;
  averageSpendInCategory: number;
}

export interface MonthlySpend {
  _id: { month: number; year: number };
  monthlySpend: number;
}

export interface CollectiveInsights {
  totalSpend: number;
  averageSpend: number;
  highestSpend: number;
  lowestSpend: number;
  categorySpendDistribution: CategorySpend[];
  frequentItems: FrequentItem[];
  avgSpendPerCategory: AverageSpendCategory[];
  monthlySpendTrend: MonthlySpend[];
}
