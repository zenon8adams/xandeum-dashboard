import { useEffect } from 'react';
import { useNetworkData } from '../hooks/useNodes';
import { LeafMeta, RootNode } from '../types';

interface ApiDataIntegratorProps {
  onLeavesGenerated: (leaves: LeafMeta[]) => void;
  onRootDataCalculated: (data: RootNode) => void;
}

export function ApiDataIntegrator({ onLeavesGenerated, onRootDataCalculated }: ApiDataIntegratorProps) {
  const { rootData, leafData, isLoading, error } = useNetworkData();

  useEffect(() => {
    if (!isLoading && !error && leafData.length > 0) {
      onLeavesGenerated(leafData);
      
      if (rootData) {
        onRootDataCalculated(rootData);
      }
    }
  }, [rootData, leafData, isLoading, error, onLeavesGenerated, onRootDataCalculated]);

  return null;
}
