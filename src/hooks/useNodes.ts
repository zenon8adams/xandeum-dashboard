import { useQuery } from '@tanstack/react-query';
import { fetchRootNode, fetchAllLeafNodes } from '../api/client';
import { useRef } from 'react';

/**
 * Hook to fetch root node data
 */
export function useRootNode() {
  const isFirstFetch = useRef(true);
  return useQuery({
    queryKey: ['rootNode'],
    queryFn:  async () => {
      const result = await fetchRootNode(isFirstFetch.current);
      isFirstFetch.current = false;
      return result;
    },
    // staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Hook to fetch all leaf nodes
 */
export function useLeafNodes() {
  const isFirstFetch = useRef(true);

  return useQuery({
    queryKey: ['leafNodes'],
    queryFn: async () => {
      const result = await fetchAllLeafNodes(isFirstFetch.current);
      isFirstFetch.current = false;
      return result;
    },
    // staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Hook to fetch and transform data into graph format
 * Note: This is kept for potential future use, but current implementation
 * passes LeafMeta data directly to components without transformation
 */
export function useNetworkData() {
  const { data: rootData, isLoading: isLoadingRoot, error: rootError } = useRootNode();
  const { data: leafData, isLoading: isLoadingLeaf, error: leafError } = useLeafNodes();

  const isLoading = isLoadingRoot || isLoadingLeaf;
  const error = rootError || leafError;

  return {
    rootData,
    leafData: leafData || [],
    isLoading,
    error,
  };
}
