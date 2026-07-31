"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Universal Query Client Provider compatible with TanStack Query API
 */
let TanstackQuery = null;
try {
  TanstackQuery = require("@tanstack/react-query");
} catch (e) {
  // TanStack query not installed yet
}

export class QueryClient {
  constructor(config = {}) {
    this.config = config;
  }
}

export const queryClient = TanstackQuery?.QueryClient
  ? new TanstackQuery.QueryClient()
  : new QueryClient();

const FallbackQueryContext = createContext(queryClient);

export function QueryClientProvider({ client = queryClient, children }) {
  if (TanstackQuery?.QueryClientProvider) {
    const Provider = TanstackQuery.QueryClientProvider;
    return <Provider client={client}>{children}</Provider>;
  }

  return (
    <FallbackQueryContext.Provider value={client}>
      {children}
    </FallbackQueryContext.Provider>
  );
}

/**
 * Universal useQuery hook compatible with TanStack Query
 */
export function useQuery({ queryKey, queryFn, enabled = true, staleTime = 0 }) {
  if (TanstackQuery?.useQuery) {
    return TanstackQuery.useQuery({ queryKey, queryFn, enabled, staleTime });
  }

  // Fallback implementation using standard React useState + useEffect
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const keyString = JSON.stringify(queryKey);

  const fetchData = async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      const res = await queryFn();
      setData(res);
    } catch (err) {
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [keyString, enabled]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchData,
  };
}

export default queryClient;
