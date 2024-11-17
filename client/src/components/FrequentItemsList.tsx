import { FrequentItem } from "@/types";

interface FrequentItemsListProps {
  items: FrequentItem[];
}

export default function FrequentItemsList({ items }: FrequentItemsListProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4">
        Most Frequently Purchased Items
      </h3>
      <ul>
        {items.map((item) => (
          <li key={item._id} className="flex justify-between py-1">
            <span>{item._id}</span>
            <span className="font-semibold">{item.frequency} times</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
