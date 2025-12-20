import React from 'react';
import * as d3 from 'd3';
import { Validator, LeafMeta, ValidatorLeafNodeAggregatedData, RootNode } from '../types';
import { validators } from '../data/validators';
import { formatBytes, formatNumber } from '../utils/dataGenerator';

interface SidebarProps {
    isDark: boolean;
    hoveredValidator: Validator | null;
    hoveredValidatorData?: ValidatorLeafNodeAggregatedData;
    hoveredLeaf: LeafMeta | null;
    rootData?: RootNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isDark,
    hoveredValidator,
    hoveredValidatorData,
    hoveredLeaf,
    rootData
}) => {
    const sidebarBg = isDark
        ? 'bg-gradient-to-b from-gray-900/95 to-gray-950/95'
        : 'bg-gradient-to-b from-white/95 to-gray-50/95';

    const textColor = isDark ? 'text-white' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const border = isDark ? 'border-gray-800/50' : 'border-gray-200/50';

    // Mini bar chart component
    const MiniBarChart: React.FC<{ value: number; max: number; color: string; label: string; showPercentage?: boolean }> = ({ value, max, color, label, showPercentage = false }) => {
        const percentage = (value / max) * 100;
        return (
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className={textSecondary}>{label}</span>
                    <span className={textColor}>
                        {showPercentage ? `${percentage.toFixed(1)}%` : formatBytes(value)}
                    </span>
                </div>
                <div className={`h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${color}, ${d3.color(color)?.brighter(0.5)})`
                        }}
                    />
                </div>
            </div>
        );
    };

    // Donut chart component
    const DonutChart: React.FC<{ percentage: number; color: string; size?: number; label?: string }> = ({ percentage, color, size = 80, label }) => {
        const strokeWidth = 8;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="flex flex-col items-center">
                <div className="relative" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="transform -rotate-90">
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={isDark ? '#374151' : '#e5e7eb'}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-bold ${textColor}`}>
                            {percentage.toFixed(1)}%
                        </span>
                    </div>
                </div>
                {label && <div className={`text-xs ${textSecondary} mt-2 text-center`}>{label}</div>}
            </div>
        );
    };

    // Stat card component
    const StatCard: React.FC<{ label: string; value: string | number; icon?: React.ReactNode; color?: string }> = ({ label, value, icon, color }) => (
        <div className={`${isDark ? 'bg-gray-800/40 border-gray-700/30' : 'bg-gray-100/60 border-gray-300/30'} p-3 rounded-xl border backdrop-blur-sm hover:scale-105 transition-transform`}>
            <div className="flex items-center justify-between mb-1">
                <div className={`text-xs uppercase ${textSecondary} font-semibold tracking-wide`}>{label}</div>
                {icon && <div style={{ color }}>{icon}</div>}
            </div>
            <div className={`text-lg font-bold ${textColor}`}>{value}</div>
        </div>
    );

    return (
        <div className={`w-[520px] h-screen ${sidebarBg} backdrop-blur-xl border-l ${border} shadow-xl overflow-y-auto flex flex-col z-10`}>
            {/* Header with Search */}
            <div className="sticky top-0 z-20 bg-inherit p-6 pb-4 backdrop-blur-xl border-b border-gray-800/30">
                <div className={`${isDark ? 'bg-gray-800/50 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} rounded-xl p-3 ${textSecondary} text-sm flex items-center gap-2 border backdrop-blur-sm`}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <span>Search nodes...</span>
                </div>
            </div>

            <div className="p-6 pt-4">
                {hoveredLeaf ? (
                    <>
                        {/* Provider Node View */}
                        <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${border}`}>
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h1 className={`m-0 text-xl font-bold ${textColor} mb-2`}>{hoveredLeaf.pubkey}</h1>
                                <div className="flex gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                        Provider
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${hoveredLeaf.is_accessible ? 'bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30'}`}>
                                        {hoveredLeaf.is_accessible ? 'Online' : 'Offline'}
                                    </span>
                                    {hoveredLeaf.is_public && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                                            Public
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Credits Display for Provider */}
                        {hoveredLeaf.credit !== undefined && (
                            <div className={`${hoveredLeaf.credit_rank === 1 ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/40 shadow-lg shadow-yellow-500/30' :
                                hoveredLeaf.credit_rank === 2 ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-gray-400/40 shadow-lg shadow-gray-400/30' :
                                    hoveredLeaf.credit_rank === 3 ? 'bg-gradient-to-br from-orange-700/20 to-orange-800/20 border-orange-700/40 shadow-lg shadow-orange-700/30' :
                                        isDark ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-100/60 to-orange-100/60 border-yellow-300/30'
                                } p-4 rounded-xl border mb-4 relative overflow-hidden`}>
                                {hoveredLeaf.credit_rank && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <div className={`${hoveredLeaf.credit_rank === 1 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                            hoveredLeaf.credit_rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                                'bg-gradient-to-r from-orange-700 to-orange-800'
                                            } px-3 py-1 rounded-full flex items-center gap-2 shadow-lg`}>
                                            <span className="text-base">
                                                {hoveredLeaf.credit_rank === 1 ? '👑' : hoveredLeaf.credit_rank === 2 ? '🥈' : '🥉'}
                                            </span>
                                            <span className="text-white text-xs font-bold">
                                                #{hoveredLeaf.credit_rank} TOP
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-xs uppercase ${textSecondary} mb-1 font-semibold flex items-center gap-2`}>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Credits Earned
                                        </div>
                                        <div className={`${hoveredLeaf.credit_rank ? 'text-4xl' : 'text-3xl'} font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2`}>
                                            {hoveredLeaf.credit.toLocaleString()}
                                        </div>
                                        {hoveredLeaf.credit_rank && (
                                            <div className={`text-xs font-bold ${hoveredLeaf.credit_rank === 1 ? 'text-yellow-600 dark:text-yellow-400' :
                                                hoveredLeaf.credit_rank === 2 ? 'text-gray-600 dark:text-gray-400' :
                                                    'text-orange-700 dark:text-orange-500'
                                                }`}>
                                                🏆 Network Leader
                                            </div>
                                        )}
                                    </div>
                                    <div className={`flex-shrink-0 ${hoveredLeaf.credit_rank ? 'mt-8' : 'mt-0'}`}>
                                        <div className={`${hoveredLeaf.credit_rank ? 'text-5xl' : 'text-5xl'}`}>
                                            {hoveredLeaf.credit_rank === 1 ? '🏆' : hoveredLeaf.credit_rank === 2 ? '🥈' : hoveredLeaf.credit_rank === 3 ? '🥉' : '💰'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Storage Overview with Charts */}
                        <div className="mb-6">
                            <h3 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M6 8h.01M10 8h.01M14 8h.01" />
                                </svg>
                                Storage Analytics
                            </h3>
                            <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-5 rounded-xl border`}>
                                <div className="grid grid-cols-2 gap-6 mb-4">
                                    <DonutChart
                                        percentage={hoveredLeaf.usage_percent}
                                        color={hoveredLeaf.usage_percent > 80 ? '#EF4444' : hoveredLeaf.usage_percent > 60 ? '#F59E0B' : '#10B981'}
                                        label="Utilization"
                                    />
                                    <div className="space-y-3">
                                        <div>
                                            <div className={`text-xs ${textSecondary} mb-1`}>Used</div>
                                            <div className={`text-2xl font-bold ${textColor}`}>{formatBytes(hoveredLeaf.storage_used)}</div>
                                        </div>
                                        <div>
                                            <div className={`text-xs ${textSecondary} mb-1`}>Committed</div>
                                            <div className={`text-lg font-semibold ${textSecondary}`}>{formatBytes(hoveredLeaf.storage_comitted)}</div>
                                        </div>
                                        <div>
                                            <div className={`text-xs ${textSecondary} mb-1`}>Available</div>
                                            <div className={`text-base font-semibold text-green-500`}>{formatBytes(hoveredLeaf.storage_comitted - hoveredLeaf.storage_used)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid - 3 columns */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <StatCard label="Uptime" value={`${hoveredLeaf.uptime.toFixed(2)}%`} color="#10B981" />
                            <StatCard label="Version" value={`v${hoveredLeaf.version}`} color="#3B82F6" />
                            <StatCard label="Status" value={hoveredLeaf.is_registered ? 'Registered' : 'Pending'} color="#8B5CF6" />
                        </div>

                        {/* Location - Full Width */}
                        {hoveredLeaf.address.ip_info && (
                            <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border mb-4`}>
                                <div className={`text-xs uppercase ${textSecondary} mb-3 font-semibold flex items-center gap-2`}>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    Location
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="text-3xl">🌍</div>
                                            <div className="flex-1">
                                                <div className={`text-base font-bold ${textColor} mb-1`}>
                                                    {hoveredLeaf.address.ip_info.countryName}
                                                </div>
                                                <div className={`text-sm ${textSecondary}`}>
                                                    {hoveredLeaf.address.ip_info.continentName}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className={`text-xs ${textSecondary}`}>Coordinates</div>
                                            <div className={`text-xs font-mono ${textColor}`}>
                                                {hoveredLeaf.address.ip_info.latitude.toFixed(4)}°N
                                            </div>
                                            <div className={`text-xs font-mono ${textColor}`}>
                                                {hoveredLeaf.address.ip_info.longitude.toFixed(4)}°E
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Endpoint */}
                        <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border mb-4`}>
                            <div className={`text-xs uppercase ${textSecondary} mb-2 font-semibold flex items-center gap-2`}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                                Endpoint
                            </div>
                            <div className={`font-mono text-xs ${isDark ? 'bg-gray-900/50 text-cyan-400 border-gray-700/50' : 'bg-white text-cyan-600 border-gray-300/50'} px-3 py-2 rounded-lg border break-all`}>
                                {hoveredLeaf.address.endpoint}
                            </div>
                        </div>

                        {/* Accessible Node Details */}
                        {hoveredLeaf.is_accessible && hoveredLeaf.accessible_node_detail && (
                            <div className="space-y-4">
                                <h3 className={`text-xs uppercase tracking-wider ${textSecondary} font-bold flex items-center gap-2`}>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                    System Metrics
                                </h3>

                                <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border space-y-3`}>
                                    <MiniBarChart
                                        value={hoveredLeaf.accessible_node_detail.cpu_usage}
                                        max={100}
                                        color="#8B5CF6"
                                        label="CPU Usage"
                                        showPercentage
                                    />
                                    <MiniBarChart
                                        value={hoveredLeaf.accessible_node_detail.total_ram_used}
                                        max={hoveredLeaf.accessible_node_detail.total_ram_available}
                                        color="#06B6D4"
                                        label="RAM Usage"
                                    />
                                    <MiniBarChart
                                        value={hoveredLeaf.accessible_node_detail.total_storage_allocated}
                                        max={hoveredLeaf.accessible_node_detail.total_storage_size}
                                        color="#10B981"
                                        label="Storage Allocated"
                                    />
                                </div>

                                {/* Network Stats - 2 columns */}
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCard
                                        label="Packets Sent"
                                        value={formatNumber(hoveredLeaf.accessible_node_detail.packets_sent)}
                                        icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                                        color="#10B981"
                                    />
                                    <StatCard
                                        label="Packets Received"
                                        value={formatNumber(hoveredLeaf.accessible_node_detail.packets_received)}
                                        icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5l-9-2 9 18 9-18-9 2zm0 0v8" /></svg>}
                                        color="#3B82F6"
                                    />
                                </div>

                                {/* Resource Details - 3 columns */}
                                <div className="grid grid-cols-3 gap-3">
                                    <StatCard label="Total RAM" value={formatBytes(hoveredLeaf.accessible_node_detail.total_ram_available)} />
                                    <StatCard label="Total Storage" value={formatBytes(hoveredLeaf.accessible_node_detail.total_storage_size)} />
                                    <StatCard label="Allocated" value={formatBytes(hoveredLeaf.accessible_node_detail.total_storage_allocated)} />
                                </div>
                            </div>
                        )}
                    </>
                ) : hoveredValidator ? (
                    <>
                        {/* Validator Node View */}
                        <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${border}`}>
                            <div
                                className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-lg relative overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${hoveredValidator.color}, ${d3.color(hoveredValidator.color)?.darker(0.5)})` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent"></div>
                                <span className="relative z-10">{hoveredValidator.name.substring(0, 2)}</span>
                            </div>
                            <div className="flex-1">
                                <h1 className={`m-0 text-xl font-bold ${textColor} mb-2`}>{hoveredValidator.name}</h1>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    v{hoveredValidator.version}
                                </span>
                            </div>
                        </div>

                        {hoveredValidatorData && (
                            <>
                                {/* Top Credit Providers Leaderboard */}
                                {hoveredValidatorData.top_credit_providers.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Top Performers by Credits
                                        </h3>
                                        <div className="space-y-3">
                                            {hoveredValidatorData.top_credit_providers.map((provider) => {
                                                const getRankStyle = (rank: number) => {
                                                    if (rank === 1) return {
                                                        bg: isDark ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/40' : 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400/60',
                                                        icon: '👑',
                                                        badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
                                                        glow: 'shadow-lg shadow-yellow-500/50'
                                                    };
                                                    if (rank === 2) return {
                                                        bg: isDark ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/40' : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400/60',
                                                        icon: '🥈',
                                                        badge: 'bg-gradient-to-r from-gray-400 to-gray-500',
                                                        glow: 'shadow-md shadow-gray-400/50'
                                                    };
                                                    return {
                                                        bg: isDark ? 'bg-gradient-to-r from-orange-700/20 to-orange-800/20 border-orange-700/40' : 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400/60',
                                                        icon: '🥉',
                                                        badge: 'bg-gradient-to-r from-orange-700 to-orange-800',
                                                        glow: 'shadow-md shadow-orange-700/50'
                                                    };
                                                };

                                                const style = getRankStyle(provider.rank);

                                                return (
                                                    <div
                                                        key={provider.pubkey}
                                                        className={`${style.bg} ${style.glow} p-4 rounded-xl border backdrop-blur-sm transition-all hover:scale-102`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <div className={`w-12 h-12 ${style.badge} rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg`}>
                                                                    {style.icon}
                                                                </div>
                                                                <div className={`absolute -top-1 -right-1 w-6 h-6 ${style.badge} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                                                                    {provider.rank}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm font-bold ${textColor} mb-1 truncate`}>
                                                                    {provider.pubkey}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                                                        {provider.credit.toLocaleString()}
                                                                    </div>
                                                                    <span className={`text-xs ${textSecondary}`}>credits</span>
                                                                </div>
                                                            </div>
                                                            {provider.rank === 1 && (
                                                                <div className="text-3xl animate-bounce">⭐</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {/* Credits Analytics */}
                                <div className="mb-6">
                                    <h3 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Credits Analytics
                                    </h3>

                                    {/* Total Credits Showcase */}
                                    <div className={`${isDark ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-100/60 to-orange-100/60 border-yellow-300/30'} p-5 rounded-xl border mb-4`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex-1">
                                                <div className={`text-xs uppercase ${textSecondary} mb-2 font-semibold`}>Total Credits Awarded</div>
                                                <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                                    {hoveredValidatorData.total_credits_awarded.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-6xl opacity-50">🏆</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-yellow-500/20">
                                            <div>
                                                <div className={`text-xs ${textSecondary} mb-1`}>Average</div>
                                                <div className={`text-lg font-bold text-yellow-600 dark:text-yellow-400`}>
                                                    {Math.floor(hoveredValidatorData.average_credits_per_pod).toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className={`text-xs ${textSecondary} mb-1`}>Highest</div>
                                                <div className={`text-lg font-bold text-orange-600 dark:text-orange-400`}>
                                                    {hoveredValidatorData.max_credits.toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <div className={`text-xs ${textSecondary} mb-1`}>Lowest</div>
                                                <div className={`text-lg font-bold ${textSecondary}`}>
                                                    {hoveredValidatorData.min_credits.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Credit Distribution by Country */}
                                    <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border`}>
                                        <h4 className={`text-xs uppercase ${textSecondary} mb-3 font-semibold`}>Top Countries by Credits</h4>
                                        <div className="space-y-3">
                                            {hoveredValidatorData.credit_distribution_by_country.map((country, index) => {
                                                const maxCredits = hoveredValidatorData.credit_distribution_by_country[0].credits;
                                                const percentage = (country.credits / maxCredits) * 100;
                                                return (
                                                    <div key={country.country}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xl">{country.flag}</span>
                                                                <span className={`text-sm ${textColor}`}>{country.country}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm font-bold text-yellow-600 dark:text-yellow-400`}>
                                                                    {country.credits.toLocaleString()}
                                                                </span>
                                                                <span className={`text-xs ${textSecondary}`}>
                                                                    (avg: {Math.floor(country.avg_per_pod)})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-yellow-500 to-orange-500"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Storage Analytics with Multiple Charts */}
                                {/* Storage Analytics with Multiple Charts */}
                                <div className="mb-6">
                                    <h3 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        Storage Analytics
                                    </h3>
                                    <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-5 rounded-xl border`}>
                                        <div className="grid grid-cols-2 gap-6 mb-4">
                                            <DonutChart
                                                percentage={hoveredValidatorData.utilization_rate}
                                                color={hoveredValidator.color}
                                                size={100}
                                                label="Utilization"
                                            />
                                            <div className="space-y-3">
                                                <div>
                                                    <div className={`text-xs ${textSecondary} mb-1`}>Total Used</div>
                                                    <div className={`text-2xl font-bold ${textColor}`}>
                                                        {formatBytes(hoveredValidatorData.total_storage_used)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className={`text-xs ${textSecondary} mb-1`}>Total Committed</div>
                                                    <div className={`text-lg font-semibold ${textSecondary}`}>
                                                        {formatBytes(hoveredValidatorData.total_storage_comitted)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className={`text-xs ${textSecondary} mb-1`}>Available</div>
                                                    <div className={`text-base font-semibold text-green-500`}>
                                                        {formatBytes(hoveredValidatorData.total_storage_comitted - hoveredValidatorData.total_storage_used)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Provider Status Overview */}
                                <div className="mb-6">
                                    <h3 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Provider Status
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className={`${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-100/60 border-green-300/30'} p-4 rounded-xl border`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={`text-xs uppercase ${textSecondary} font-semibold tracking-wide`}>Online</div>
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            </div>
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {hoveredValidatorData.online_count}
                                            </div>
                                            <div className={`text-xs ${textSecondary} mt-1`}>
                                                {((hoveredValidatorData.online_count / hoveredValidatorData.operators) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className={`${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-100/60 border-red-300/30'} p-4 rounded-xl border`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={`text-xs uppercase ${textSecondary} font-semibold tracking-wide`}>Offline</div>
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            </div>
                                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                {hoveredValidatorData.offline_count}
                                            </div>
                                            <div className={`text-xs ${textSecondary} mt-1`}>
                                                {((hoveredValidatorData.offline_count / hoveredValidatorData.operators) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Distribution Chart */}
                                    <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border`}>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className={textSecondary}>Accessible</span>
                                                    <span className={textColor}>{hoveredValidatorData.accessible_count} / {hoveredValidatorData.operators}</span>
                                                </div>
                                                <div className={`h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                                                        style={{ width: `${(hoveredValidatorData.accessible_count / hoveredValidatorData.operators) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className={textSecondary}>Registered</span>
                                                    <span className={textColor}>{hoveredValidatorData.registered_count} / {hoveredValidatorData.operators}</span>
                                                </div>
                                                <div className={`h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                                                        style={{ width: `${(hoveredValidatorData.registered_count / hoveredValidatorData.operators) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Visibility Distribution */}
                                <div className="mb-6">
                                    <h3 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Visibility
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`${isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-100/60 border-purple-300/30'} p-4 rounded-xl border text-center`}>
                                            <div className={`text-xs uppercase ${textSecondary} font-semibold tracking-wide mb-2`}>Public</div>
                                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                                {hoveredValidatorData.public_count}
                                            </div>
                                            <div className={`text-xs ${textSecondary}`}>
                                                {((hoveredValidatorData.public_count / hoveredValidatorData.operators) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className={`${isDark ? 'bg-gray-700/30 border-gray-600/30' : 'bg-gray-200/60 border-gray-400/30'} p-4 rounded-xl border text-center`}>
                                            <div className={`text-xs uppercase ${textSecondary} font-semibold tracking-wide mb-2`}>Private</div>
                                            <div className={`text-3xl font-bold ${textColor} mb-1`}>
                                                {hoveredValidatorData.private_count}
                                            </div>
                                            <div className={`text-xs ${textSecondary}`}>
                                                {((hoveredValidatorData.private_count / hoveredValidatorData.operators) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Geographic Distribution */}
                                <div className="mb-6">
                                    <h3 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                        </svg>
                                        Geographic Distribution
                                    </h3>
                                    <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border space-y-3`}>
                                        {hoveredValidatorData.country_distribution.map((country, index) => {
                                            const percentage = (country.count / hoveredValidatorData.operators) * 100;
                                            return (
                                                <div key={country.country}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl">{country.flag}</span>
                                                            <span className={`text-sm ${textColor}`}>{country.country}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold ${textColor}`}>{country.count}</span>
                                                            <span className={`text-xs ${textSecondary}`}>({percentage.toFixed(1)}%)</span>
                                                        </div>
                                                    </div>
                                                    <div className={`h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                background: `linear-gradient(90deg, ${hoveredValidator.color}, ${d3.color(hoveredValidator.color)?.brighter(0.5)})`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Performance Metrics */}
                                <div className="mb-6">
                                    <h3 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Performance Metrics
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <StatCard
                                            label="Avg Uptime"
                                            value={`${hoveredValidatorData.average_uptime.toFixed(2)}%`}
                                            icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                            color="#10B981"
                                        />
                                        <StatCard
                                            label="Avg CPU"
                                            value={`${hoveredValidatorData.average_cpu_usage.toFixed(1)}%`}
                                            icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>}
                                            color="#8B5CF6"
                                        />
                                        <StatCard
                                            label="Avg RAM"
                                            value={`${hoveredValidatorData.average_ram_usage.toFixed(1)}%`}
                                            icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M6 11h.01M10 11h.01M14 11h.01M18 11h.01M6 15h.01M10 15h.01M14 15h.01M18 15h.01" /></svg>}
                                            color="#06B6D4"
                                        />
                                        <StatCard
                                            label="Operators"
                                            value={hoveredValidatorData.operators}
                                            icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" /></svg>}
                                            color="#F59E0B"
                                        />
                                    </div>

                                    {/* Network Traffic */}
                                    <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border`}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-green-500">
                                                        <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                    <span className={`text-xs ${textSecondary}`}>Packets Sent</span>
                                                </div>
                                                <div className={`text-lg font-bold ${textColor}`}>
                                                    {formatNumber(hoveredValidatorData.total_packets_sent)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-blue-500">
                                                        <path d="M12 5l-9-2 9 18 9-18-9 2zm0 0v8" />
                                                    </svg>
                                                    <span className={`text-xs ${textSecondary}`}>Packets Received</span>
                                                </div>
                                                <div className={`text-lg font-bold ${textColor}`}>
                                                    {formatNumber(hoveredValidatorData.total_packets_received)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Metrics Summary */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <StatCard
                                        label="Avg/Provider"
                                        value={formatBytes(hoveredValidatorData.average_storage_per_pod)}
                                        color="#06B6D4"
                                    />
                                    <StatCard
                                        label="Efficiency"
                                        value={`${hoveredValidatorData.utilization_rate.toFixed(1)}%`}
                                        color={hoveredValidator.color}
                                    />
                                </div>

                                {/* Storage Distribution */}
                                <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border mb-6`}>
                                    <h4 className={`text-xs uppercase ${textSecondary} mb-3 font-semibold flex items-center gap-2`}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                        </svg>
                                        Storage Distribution
                                    </h4>
                                    <div className="space-y-3">
                                        <MiniBarChart
                                            value={hoveredValidatorData.total_storage_used}
                                            max={hoveredValidatorData.total_storage_comitted}
                                            color={hoveredValidator.color}
                                            label="Utilization"
                                        />
                                        <div className={`pt-3 border-t ${border}`}>
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <span className={textSecondary}>Available Space</span>
                                                    <div className={`${textColor} font-bold text-base mt-1`}>
                                                        {formatBytes(hoveredValidatorData.total_storage_comitted - hoveredValidatorData.total_storage_used)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={textSecondary}>Capacity</span>
                                                    <div className={`${textColor} font-bold text-base mt-1`}>
                                                        {formatBytes(hoveredValidatorData.total_storage_comitted)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Description */}
                        <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-4 rounded-xl border mb-4`}>
                            <h4 className={`text-xs uppercase ${textSecondary} mb-2 font-semibold`}>About This Version</h4>
                            <p className={`text-sm ${textSecondary} leading-relaxed`}>
                                {hoveredValidator.description}
                            </p>
                        </div>

                        {/* Documentation Link */}
                        <a
                            href={hoveredValidator.docsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isDark ? 'bg-gray-800/40 hover:bg-gray-800/60 border-gray-700/30' : 'bg-gray-100/60 hover:bg-gray-100/80 border-gray-300/30'} p-4 rounded-xl border backdrop-blur-sm flex items-center justify-between group transition-all`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <div className={`text-sm font-semibold ${textColor}`}>Documentation</div>
                                    <div className={`text-xs ${textSecondary}`}>Learn more about v{hoveredValidator.version}</div>
                                </div>
                            </div>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:translate-x-1 transition-transform">
                                <path d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </>
                ) : (
                    <>
                        {/* Root/Network Overview */}
                        <h1 className={`text-3xl font-bold ${textColor} mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent`}>
                            Network Overview
                        </h1>
                        <p className={`text-sm ${textSecondary} leading-relaxed mb-6`}>
                            Real-time visualization of the{' '}
                            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors font-semibold">
                                Xandeum
                            </a>{' '}
                            decentralized network. Monitor validators, providers, and network health across different software versions.
                        </p>

                        {rootData && (
                            <>
                                {/* Network Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className={`${isDark ? 'bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-purple-500/20' : 'bg-gradient-to-br from-purple-100/50 to-cyan-100/50 border-purple-300/30'} p-5 rounded-xl border backdrop-blur-sm col-span-2`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className={`text-xs uppercase ${textSecondary} mb-2 font-semibold tracking-wider`}>Total Providers</div>
                                                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                                    {rootData.total_pods.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="text-5xl opacity-20">🌐</div>
                                        </div>
                                    </div>

                                    {rootData.total_credits !== undefined && rootData.total_credits > 0 && (
                                        <div className={`${isDark ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-100/60 to-orange-100/60 border-yellow-300/30'} p-4 rounded-xl border col-span-2`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className={`text-xs uppercase ${textSecondary} mb-1 font-semibold tracking-wide`}>Network Credits</div>
                                                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                                                        {rootData.total_credits.toLocaleString()}
                                                    </div>
                                                    <div className={`text-xs ${textSecondary} mt-1`}>
                                                        Avg: {Math.floor(rootData.total_credits / rootData.total_pods).toLocaleString()} per provider
                                                    </div>
                                                </div>
                                                <div className="text-5xl">💎</div>
                                            </div>
                                        </div>
                                    )}

                                    <StatCard
                                        label="Total Committed"
                                        value={formatBytes(rootData.total_storage_comitted)}
                                        icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
                                        color="#8B5CF6"
                                    />
                                    <StatCard
                                        label="Total Used"
                                        value={formatBytes(rootData.total_storage_used)}
                                        icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>}
                                        color="#06B6D4"
                                    />
                                </div>

                                {/* Network Utilization - Enhanced */}
                                <div className={`${isDark ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-100/50 border-gray-300/30'} p-5 rounded-xl border mb-6`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className={`text-xs uppercase tracking-wider ${textSecondary} font-bold flex items-center gap-2`}>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                            </svg>
                                            Network Utilization
                                        </h3>
                                        <span className={`text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent`}>
                                            {rootData.utilization_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className={`h-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden mb-3`}>
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${rootData.utilization_rate}%`,
                                                background: 'linear-gradient(90deg, #9945FF, #14F195, #00D4FF)'
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <span className={textSecondary}>Avg per Provider</span>
                                            <div className={`${textColor} font-bold text-sm mt-1`}>
                                                {formatBytes(rootData.average_storage_per_pod)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className={textSecondary}>Efficiency Score</span>
                                            <div className={`${textColor} font-bold text-sm mt-1`}>
                                                {rootData.utilization_rate > 80 ? 'Excellent' : rootData.utilization_rate > 60 ? 'Good' : 'Moderate'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Validator Versions */}
                        <h2 className={`text-xs uppercase tracking-wider ${textSecondary} mb-4 font-bold flex items-center gap-2`}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 2v20M2 12h20" />
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                            Validator Versions
                        </h2>
                        <div className="space-y-2">
                            {validators.map((v) => (
                                <div
                                    key={v.name}
                                    className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm ${textSecondary} transition-all cursor-pointer hover:${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} group border ${isDark ? 'border-gray-800/30' : 'border-gray-200/30'}`}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full shadow-lg group-hover:scale-125 transition-transform"
                                        style={{
                                            background: v.color,
                                            boxShadow: `0 0 12px ${v.color}50`
                                        }}
                                    />
                                    <span className={`group-hover:${textColor} transition-colors flex-1 font-medium`}>{v.name}</span>
                                    <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'} ${textSecondary}`}>
                                        v{v.version}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};