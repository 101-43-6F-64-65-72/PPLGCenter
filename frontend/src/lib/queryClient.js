"use client";

import React from "react";

/**
 * Universal Query Client Provider compatible with TanStack Query API
 */
import { QueryClient as TanstackQueryClient, QueryClientProvider as TanstackQueryClientProvider, useQuery as useTanstackQuery } from "@tanstack/react-query";

export class QueryClient {
  constructor(config = {}) {
    this.config = config;
  }
}

export const queryClient = new TanstackQueryClient();

export function QueryClientProvider({ client = queryClient, children }) {
  return <TanstackQueryClientProvider client={client}>{children}</TanstackQueryClientProvider>;
}

export function useQuery({ queryKey, queryFn, enabled = true, staleTime = 0 }) {
  return useTanstackQuery({ queryKey, queryFn, enabled, staleTime });
}

export default queryClient;
