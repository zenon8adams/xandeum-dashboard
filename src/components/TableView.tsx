import React, { useEffect, useState, useRef, useCallback } from 'react';
import { LeafMeta } from '../types';
import { formatBytes } from '../utils/dataGenerator';

interface TableViewProps {
    isDark: boolean;
    allLeaves: LeafMeta[];
    onLeafHover: (leaf: LeafMeta | null) => void;
    selectedLeaf: LeafMeta | null;
}

export const TableView: React.FC<TableViewProps> = ({ isDark, allLeaves, onLeafHover, selectedLeaf }) => {
    const [displayedLeaves, setDisplayedLeaves] = useState<LeafMeta[]>([]);
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<'credit' | 'storage' | 'uptime' | 'pubkey'>('credit');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const observerTarget = useRef<HTMLDivElement>(null);
    const ITEMS_PER_PAGE = 50;

    const bgColor = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
    const cardBg = isDark ? 'bg-gray-800/50' : 'bg-white';
    const border = isDark ? 'border-gray-700/50' : 'border-gray-200';
    const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const hoverBg = isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100';

    // Filter and sort leaves
    const filteredAndSortedLeaves = React.useMemo(() => {
        let filtered = allLeaves;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(leaf =>
                leaf.pubkey.toLowerCase().includes(searchQuery.toLowerCase()) ||
                leaf.address.ip_info?.countryName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'credit':
                    aValue = a.credit || 0;
                    bValue = b.credit || 0;
                    break;
                case 'storage':
                    aValue = a.usage_percent;
                    bValue = b.usage_percent;
                    break;
                case 'uptime':
                    aValue = a.uptime;
                    bValue = b.uptime;
                    break;
                case 'pubkey':
                    aValue = a.pubkey;
                    bValue = b.pubkey;
                    break;
                default:
                    return 0;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return sorted;
    }, [allLeaves, searchQuery, sortBy, sortOrder]);

    // Load initial data
    useEffect(() => {
        setDisplayedLeaves(filteredAndSortedLeaves.slice(0, ITEMS_PER_PAGE));
        setPage(1);
    }, [filteredAndSortedLeaves]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [page, filteredAndSortedLeaves]);

    const loadMore = useCallback(() => {
        const nextPage = page + 1;
        const startIndex = 0;
        const endIndex = nextPage * ITEMS_PER_PAGE;

        if (endIndex <= filteredAndSortedLeaves.length) {
            setDisplayedLeaves(filteredAndSortedLeaves.slice(startIndex, endIndex));
            setPage(nextPage);
        } else if (displayedLeaves.length < filteredAndSortedLeaves.length) {
            setDisplayedLeaves(filteredAndSortedLeaves);
        }
    }, [page, filteredAndSortedLeaves, displayedLeaves.length]);

    const handleSort = (column: typeof sortBy) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const getStatusBadge = (leaf: LeafMeta) => {
        const isOnline = leaf.is_accessible && leaf.last_seen;
        return (
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-xs font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
        );
    };

    const getRankBadge = (rank?: number) => {
        if (!rank) return null;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                rank === 1 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                'bg-gradient-to-r from-orange-700 to-orange-800 text-white'
            }`}>
                #{rank}
            </span>
        );
    };

    const SortIcon = ({ column }: { column: typeof sortBy }) => {
        if (sortBy !== column) {
            return (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="opacity-30">
                    <path d="M7 10l5 5 5-5H7z" />
                </svg>
            );
        }
        return sortOrder === 'asc' ? (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M7 14l5-5 5 5H7z" />
            </svg>
        ) : (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5H7z" />
            </svg>
        );
    };

    return (
        <div className={`flex-1 h-screen ${bgColor} overflow-hidden flex flex-col`}>
            {/* Header with search and stats */}
            <div className={`${cardBg} border-b ${border} backdrop-blur-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className={`text-2xl font-bold ${textColor} mb-1`}>Provider Directory</h2>
                        <p className={textSecondary}>
                            Showing {displayedLeaves.length} of {filteredAndSortedLeaves.length} providers
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} px-4 py-2 rounded-lg`}>
                            <div className={`text-xs ${textSecondary} mb-1`}>Total Online</div>
                            <div className={`text-xl font-bold text-green-600 dark:text-green-400`}>
                                {allLeaves.filter(l => l.is_accessible && l.last_seen).length}
                            </div>
                        </div>
                        <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} px-4 py-2 rounded-lg`}>
                            <div className={`text-xs ${textSecondary} mb-1`}>Total Credits</div>
                            <div className={`text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent`}>
                                {allLeaves.reduce((sum, l) => sum + (l.credit || 0), 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondary}`} width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by public key or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 ${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto table-scroll">
                <table className="w-full">
                    <thead className={`${cardBg} sticky top-0 z-10 border-b ${border} backdrop-blur-xl`}>
                        <tr>
                            <th className={`px-6 py-4 text-left ${textSecondary} text-xs font-semibold uppercase tracking-wider`}>
                                <button onClick={() => handleSort('pubkey')} className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                                    Provider
                                    <SortIcon column="pubkey" />
                                </button>
                            </th>
                            <th className={`px-6 py-4 text-left ${textSecondary} text-xs font-semibold uppercase tracking-wider`}>
                                Location
                            </th>
                            <th className={`px-6 py-4 text-left ${textSecondary} text-xs font-semibold uppercase tracking-wider`}>
                                Status
                            </th>
                            <th className={`px-6 py-4 text-left ${textSecondary} text-xs font-semibold uppercase tracking-wider`}>
                                <button onClick={() => handleSort('credit')} className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                                    Credits
                                    <SortIcon column="credit" />
                                </button>
                            </th>
                            <th className={`px-6 py-4 text-left ${textSecondary} text-xs font-semibold uppercase tracking-wider`}>
                                <button onClick={() => handleSort('storage')} className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                                    Storage
                                    <SortIcon column="storage" />
                                </button>
                            </th>
                            <th className={`px-6 py-4 text-left ${textSecondary} text-xs font-semibold uppercase tracking-wider`}>
                                Resources
                            </th>
                            <th className={`px-6 py-4 text-left ${textSecondary} text-xs font-semibold uppercase tracking-wider`}>
                                <button onClick={() => handleSort('uptime')} className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                                    Uptime
                                    <SortIcon column="uptime" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedLeaves.map((leaf, index) => (
                            <tr
                                key={leaf.pubkey}
                                onClick={() => onLeafHover(leaf)}
                                onMouseEnter={() => onLeafHover(leaf)}
                                className={`${hoverBg} ${selectedLeaf?.pubkey === leaf.pubkey ? (isDark ? 'bg-purple-900/20' : 'bg-purple-100') : ''} border-b ${border} cursor-pointer transition-colors`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                                            
                                            isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                            {'📦'}
                                        </div>
                                        <div>
                                            <div className={`font-mono text-sm ${textColor} font-medium flex items-center gap-2`}>
                                                {leaf.pubkey.substring(0, 8)}...{leaf.pubkey.substring(leaf.pubkey.length - 6)}
                                            </div>
                                            <div className={`text-xs ${textSecondary}`}>v{leaf.version}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {leaf.address.ip_info && (
                                            <>
                                                <span className="text-xl">{leaf.address.ip_info.countryCode === 'US' ? '🇺🇸' : 
                                                    leaf.address.ip_info.countryCode === 'GB' ? '🇬🇧' :
                                                    leaf.address.ip_info.countryCode === 'DE' ? '🇩🇪' :
                                                    leaf.address.ip_info.countryCode === 'JP' ? '🇯🇵' :
                                                    leaf.address.ip_info.countryCode === 'SG' ? '🇸🇬' :
                                                    leaf.address.ip_info.countryCode === 'AU' ? '🇦🇺' :
                                                    leaf.address.ip_info.countryCode === 'CA' ? '🇨🇦' :
                                                    leaf.address.ip_info.countryCode === 'FR' ? '🇫🇷' :
                                                    leaf.address.ip_info.countryCode === 'BR' ? '🇧🇷' :
                                                    leaf.address.ip_info.countryCode === 'IN' ? '🇮🇳' : '🌍'
                                                }</span>
                                                <div>
                                                    <div className={`text-sm ${textColor}`}>{leaf.address.ip_info.countryName}</div>
                                                    <div className={`text-xs ${textSecondary}`}>{leaf.address.ip_info.continentName}</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(leaf)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                        {(leaf.credit || 0).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <div className={`text-sm ${textColor} mb-1`}>
                                            {formatBytes(leaf.storage_used)} / {formatBytes(leaf.storage_comitted)}
                                        </div>
                                        <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                                                style={{ width: `${leaf.usage_percent}%` }}
                                            />
                                        </div>
                                        <div className={`text-xs ${textSecondary} mt-1`}>{leaf.usage_percent.toFixed(1)}% used</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {leaf.accessible_node_detail ? (
                                        <div className="space-y-1">
                                            <div className={`text-xs ${textSecondary}`}>
                                                CPU: <span className={textColor}>{leaf.accessible_node_detail.cpu_usage.toFixed(1)}%</span>
                                            </div>
                                            <div className={`text-xs ${textSecondary}`}>
                                                RAM: <span className={textColor}>{((leaf.accessible_node_detail.total_ram_used / leaf.accessible_node_detail.total_ram_available) * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`text-xs ${textSecondary}`}>N/A</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                                            <div
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                                                style={{ width: `${leaf.uptime}%` }}
                                            />
                                        </div>
                                        <span className={`text-sm font-medium ${textColor}`}>{leaf.uptime.toFixed(1)}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Loading indicator */}
                {displayedLeaves.length < filteredAndSortedLeaves.length && (
                    <div ref={observerTarget} className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                )}

                {/* No results */}
                {filteredAndSortedLeaves.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={textSecondary}>
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <p className={`${textColor} text-lg font-medium mt-4`}>No providers found</p>
                        <p className={textSecondary}>Try adjusting your search query</p>
                    </div>
                )}
            </div>
        </div>
    );
};