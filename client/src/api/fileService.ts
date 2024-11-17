import { CollectiveInsights, Receipt } from "@/types";
import axios from "axios";

export const fetchInsights = async (): Promise<Receipt[]> => {
  const response = await axios.get(
    `${import.meta.env.VITE_SERVER_URL}/file/insights`
  );
  return response.data;
};

export const fetchCollectiveInsights =
  async (): Promise<CollectiveInsights> => {
    const response = await axios.get(
      `${import.meta.env.VITE_SERVER_URL}/file/collective-insights`
    );
    return response.data;
  };
