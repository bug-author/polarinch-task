import { useInsights } from "@/hooks/useInsights";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Receipt } from "@/types";

const Insights = () => {
  const { data: insightsData, isLoading } = useInsights();

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 p-4 min-h-[calc(100vh-4rem)]">
      {insightsData && insightsData.length === 0 ? (
        <p className="text-center text-gray-600">No insights available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightsData?.map((receipt: Receipt, index: number) => (
            <div
              key={index}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold">{receipt.fileName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Date: {new Date(receipt.date).toLocaleDateString()}
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                Total: £{receipt.total.toFixed(2)}
              </p>

              <div className="mt-4">
                <h3 className="text-md font-semibold">Items</h3>
                <ul className="space-y-2">
                  {receipt.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between text-gray-700 dark:text-gray-300"
                    >
                      <span>
                        {item.item} ({item.quantity})
                      </span>
                      <span>
                        £{item.price.toFixed(2)} - {item.category}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Insights;
