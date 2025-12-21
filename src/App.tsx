import { useCallback, useEffect, useState } from 'react';
import { Validator, LeafMeta, ValidatorLeafNodeAggregatedData } from './types';
import { NetworkGraph } from './components/NetworkGraph';
import { Sidebar } from './components/Sidebar';
import { TableView } from './components/TableView';
import { ViewToggle } from './components/ToggleView';
import { aggregateLeafData } from './utils/dataGenerator';

export default function SolanaNetworkTopology() {
    const [hoveredValidator, setHoveredValidator] = useState<Validator | null>(null);
    const [hoveredValidatorData, setHoveredValidatorData] = useState<ValidatorLeafNodeAggregatedData | undefined>(undefined);
    const [hoveredLeaf, setHoveredLeaf] = useState<LeafMeta | null>(null);
    const [rootData, setRootData] = useState<{
        total_pods: number;
        total_storage_comitted: number;
        total_storage_used: number;
        average_storage_per_pod: number;
        utilization_rate: number;
        total_credits?: number;
    } | undefined>(undefined);
    const [isDark, setIsDark] = useState(false);
    const [view, setView] = useState<'network' | 'table'>('network');
    const [allLeaves, setAllLeaves] = useState<LeafMeta[]>([]);
    const [globalAggregatedData, setGlobalAggregatedData] = useState<ValidatorLeafNodeAggregatedData | undefined>(undefined);

    // Detect system theme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Compute global aggregated data when leaves change
    // This ensures global top 3 credit rankings are computed
    useEffect(() => {
        if (allLeaves.length > 0) {
            // Sort all leaves by credit to find global top 3
            // Prioritize nodes that already have credit_rank assigned, then by credit amount
            const sortedByCredit = [...allLeaves]
                .filter(leaf => leaf.credit !== undefined)
                .sort((a, b) => {
                    // First, prioritize nodes that already have a credit_rank
                    const aHasRank = a.credit_rank !== undefined;
                    const bHasRank = b.credit_rank !== undefined;
                    
                    if (aHasRank && !bHasRank) return -1;
                    if (!aHasRank && bHasRank) return 1;
                    
                    // If both have ranks, sort by rank value
                    if (aHasRank && bHasRank) {
                        return (a.credit_rank || 0) - (b.credit_rank || 0);
                    }
                    
                    // Otherwise, sort by credit amount descending
                    return (b.credit || 0) - (a.credit || 0);
                });
            
            // Clear all existing ranks first
            allLeaves.forEach(leaf => {
                delete leaf.credit_rank;
            });
            
            // Assign ranks based on credit scores, handling ties
            // Multiple nodes with the same credit get the same rank
            let currentRank = 1;
            let previousCredit: number | undefined = undefined;
            const topProviders: Array<{ pubkey: string; credit: number; rank: number }> = [];
            
            sortedByCredit.forEach((leaf, index) => {
                const currentCredit = leaf.credit || 0;
                
                // If credit is different from previous, update rank based on position
                if (previousCredit !== undefined && currentCredit < previousCredit) {
                    currentRank = index + 1; // Move to next rank position
                }
                
                // Only assign ranks 1, 2, or 3
                if (currentRank <= 3) {
                    leaf.credit_rank = currentRank;
                    topProviders.push({
                        pubkey: leaf.pubkey,
                        credit: currentCredit,
                        rank: currentRank
                    });
                }
                
                previousCredit = currentCredit;
                
                // Stop if we've passed rank 3
                if (currentRank > 3) {
                    return;
                }
            });

            // Now compute aggregated data with updated ranks
            const aggregated = aggregateLeafData(allLeaves);
            // Override top_credit_providers to include all tied rankings
            aggregated.top_credit_providers = topProviders;
            setGlobalAggregatedData(aggregated);
        }
    }, [allLeaves]);

    const handleValidatorHover = useCallback((validator: Validator | null, aggregatedData?: ValidatorLeafNodeAggregatedData) => {
        setHoveredValidator(validator);
        setHoveredValidatorData(aggregatedData);
    }, []);

    const handleLeavesGenerated = useCallback((leaves: LeafMeta[]) => {
        setAllLeaves(leaves);
    }, []);

    // When in table view and a leaf is selected, clear validator hover
    // and ensure the leaf has the correct global credit_rank
    const handleLeafHoverInTable = useCallback((leaf: LeafMeta | null) => {
        if (leaf && view === 'table' && globalAggregatedData) {
            // Find this leaf in the global top 3 to ensure it has the correct rank
            const topProvider = globalAggregatedData.top_credit_providers.find(
                provider => provider.pubkey === leaf.pubkey
            );
            
            if (topProvider) {
                // Update the leaf with global rank
                leaf.credit_rank = topProvider.rank;
            } else {
                // Not in top 3, ensure rank is cleared
                delete leaf.credit_rank;
            }
        }
        
        setHoveredLeaf(leaf);
        if (view === 'table') {
            setHoveredValidator(null);
            setHoveredValidatorData(undefined);
        }
    }, [view, globalAggregatedData]);

    // Get the appropriate validator data based on view mode
    const getValidatorDataForSidebar = () => {
        if (view === 'table' && !hoveredValidator && !hoveredLeaf) {
            // In table view with no specific selection, show global data
            return globalAggregatedData;
        }
        return hoveredValidatorData;
    };

    // Theme toggle handler
    const handleThemeToggle = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden font-['Space_Grotesk',system-ui,-apple-system,'Segoe_UI',sans-serif]">
            {view === 'network' ? (
                <NetworkGraph 
                    isDark={isDark}
                    onValidatorHover={handleValidatorHover}
                    onLeafHover={setHoveredLeaf}
                    onRootDataCalculated={setRootData}
                    onLeavesGenerated={handleLeavesGenerated}
                />
            ) : (
                <TableView
                    isDark={isDark}
                    allLeaves={allLeaves}
                    onLeafHover={handleLeafHoverInTable}
                    selectedLeaf={hoveredLeaf}
                />
            )}
            
            <Sidebar 
                isDark={isDark}
                hoveredValidator={hoveredValidator}
                hoveredValidatorData={getValidatorDataForSidebar()}
                hoveredLeaf={hoveredLeaf}
                rootData={rootData}
                onThemeToggle={handleThemeToggle}
            />

            <ViewToggle
                isDark={isDark}
                view={view}
                onToggle={setView}
            />
        </div>
    );
}