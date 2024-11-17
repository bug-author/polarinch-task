import { useQuery } from "@tanstack/react-query";
import { fetchInsights } from "../api/fileService";
import { Receipt } from "@/types";

export const useInsights = () => {
  const { data, isLoading } = useQuery<Receipt[]>({
    queryKey: ["insights"],
    queryFn: fetchInsights,
  });

  return { data, isLoading };
};
