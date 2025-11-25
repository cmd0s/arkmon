"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useServices(testnet: string) {
  return useSWR(`/api/services?testnet=${testnet}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  });
}

export function useMetrics(testnet: string, hours: number = 24) {
  return useSWR(`/api/metrics?testnet=${testnet}&hours=${hours}`, fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  });
}

export function useRpcTests(testnet: string, hours: number = 24) {
  return useSWR(`/api/rpc-tests?testnet=${testnet}&hours=${hours}`, fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  });
}

export function useTestnets() {
  return useSWR("/api/testnets", fetcher, {
    revalidateOnFocus: false,
  });
}

export function useWallet() {
  return useSWR("/api/wallet", fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  });
}
