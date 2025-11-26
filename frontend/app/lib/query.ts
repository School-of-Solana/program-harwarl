import { useMutation, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./axios";
import { EscrowData, EscrowPayload } from "../types/escrow";
import { AxiosError } from "axios";

export const useGetEscrows = (walletAddress: string) => {
  return useQuery({
    queryKey: ["escrow", walletAddress],
    queryFn: async () => {
      if (!walletAddress) {
        throw new Error("Missing Wallet Address");
      }
      const { data } = await axiosInstance.get(`/escrow/${walletAddress}`);
      return data as EscrowData[];
    },
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });
};

export const useCreateEscrow = () => {
  return useMutation<EscrowData, Error, EscrowPayload>({
    mutationFn: async (createEscrowPayload: EscrowPayload) => {
      try {
        const { data } = await axiosInstance.post(
          "/escrow",
          createEscrowPayload
        );

        console.log("Use Create Escrow Data", useCreateEscrow);

        return data.data;
      } catch (error: unknown) {
        console.log({ error });
        if (error instanceof AxiosError) {
          throw new Error(error.response?.data?.message || "Unknown error");
        } else {
          throw new Error("An unexpected error occurred");
        }
      }
    },
  });
};
