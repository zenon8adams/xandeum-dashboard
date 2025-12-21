import { useQuery } from '@tanstack/react-query';
import { fetchRootNode, fetchAllLeafNodes } from '../api/client';
import { getValidatorForVersion } from '../utils/versionBucketing';
import { validators } from '../data/validators';
import type { NodeData, LinkData } from '../types';

/**
 * Hook to fetch root node data
 */
export function useRootNode() {
  return useQuery({
    queryKey: ['rootNode'],
    queryFn: fetchRootNode,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch all leaf nodes
 */
export function useLeafNodes() {
  return useQuery({
    queryKey: ['leafNodes'],
    queryFn: fetchAllLeafNodes,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
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

  // Return raw data - leafData is already LeafMeta[] which matches the expected format
  return {
    rootData,
    leafData: leafData || [],
    isLoading,
    error,
  };
}
