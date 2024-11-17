import { useQuery } from "@tanstack/react-query";
import { fetchCollectiveInsights } from "../api/fileService";
import { CollectiveInsights } from "../types";

export const useCollectiveInsights = () => {
  const { data, isLoading } = useQuery<CollectiveInsights>({
    queryKey: ["collective-insights"],
    queryFn: fetchCollectiveInsights,
  });

  return { data, isLoading };
};
