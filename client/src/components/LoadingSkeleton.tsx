import { Skeleton } from "./ui";

export default function LoadingSkeleton() {
  return (
    <div className="flex items-center space-x-4 justify-center mt-20">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}
