import { useCallback, useEffect, useState } from 'react';
import { Validator, LeafMeta, ValidatorLeafNodeAggregatedData } from './types';
import { NetworkGraph } from './components/NetworkGraph';
import { Sidebar } from './components/Sidebar';
import { TableView } from './components/TableView';
import { ViewToggle } from './components/ToggleView';

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

    // Detect system theme preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const handleValidatorHover = useCallback((validator: Validator | null, aggregatedData?: ValidatorLeafNodeAggregatedData) => {
        setHoveredValidator(validator);
        setHoveredValidatorData(aggregatedData);
    }, []);

    const handleLeavesGenerated = useCallback((leaves: LeafMeta[]) => {
        setAllLeaves(leaves);
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
                    onLeafHover={setHoveredLeaf}
                    selectedLeaf={hoveredLeaf}
                />
            )}
            
            <Sidebar 
                isDark={isDark}
                hoveredValidator={hoveredValidator}
                hoveredValidatorData={hoveredValidatorData}
                hoveredLeaf={hoveredLeaf}
                rootData={rootData}
            />

            <ViewToggle
                isDark={isDark}
                view={view}
                onToggle={setView}
            />
        </div>
    );
}