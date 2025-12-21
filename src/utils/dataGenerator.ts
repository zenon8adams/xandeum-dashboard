import { LeafMeta, IpAddressDetail, ValidatorLeafNodeAggregatedData } from '../types';

const countries = [
    { code: 'US', name: 'United States', continent: 'North America', continentCode: 'NA', lat: 37.0902, lon: -95.7129 },
    { code: 'GB', name: 'United Kingdom', continent: 'Europe', continentCode: 'EU', lat: 55.3781, lon: -3.4360 },
    { code: 'DE', name: 'Germany', continent: 'Europe', continentCode: 'EU', lat: 51.1657, lon: 10.4515 },
    { code: 'JP', name: 'Japan', continent: 'Asia', continentCode: 'AS', lat: 36.2048, lon: 138.2529 },
    { code: 'SG', name: 'Singapore', continent: 'Asia', continentCode: 'AS', lat: 1.3521, lon: 103.8198 },
    { code: 'AU', name: 'Australia', continent: 'Oceania', continentCode: 'OC', lat: -25.2744, lon: 133.7751 },
    { code: 'CA', name: 'Canada', continent: 'North America', continentCode: 'NA', lat: 56.1304, lon: -106.3468 },
    { code: 'FR', name: 'France', continent: 'Europe', continentCode: 'EU', lat: 46.2276, lon: 2.2137 },
];

export const generateLeafMeta = (index: number, version: string): LeafMeta => {
    const allCountries = [
        { code: 'US', name: 'United States', continent: 'North America', lat: 37.0902, lon: -95.7129 },
        { code: 'DE', name: 'Germany', continent: 'Europe', lat: 51.1657, lon: 10.4515 },
        { code: 'JP', name: 'Japan', continent: 'Asia', lat: 36.2048, lon: 138.2529 },
        { code: 'GB', name: 'United Kingdom', continent: 'Europe', lat: 55.3781, lon: -3.4360 },
        { code: 'SG', name: 'Singapore', continent: 'Asia', lat: 1.3521, lon: 103.8198 },
        { code: 'FR', name: 'France', continent: 'Europe', lat: 46.2276, lon: 2.2137 },
        { code: 'CA', name: 'Canada', continent: 'North America', lat: 56.1304, lon: -106.3468 },
        { code: 'AU', name: 'Australia', continent: 'Oceania', lat: -25.2744, lon: 133.7751 },
        { code: 'BR', name: 'Brazil', continent: 'South America', lat: -14.2350, lon: -51.9253 },
        { code: 'IN', name: 'India', continent: 'Asia', lat: 20.5937, lon: 78.9629 },
    ];

    const selectedCountry = allCountries[Math.floor(Math.random() * allCountries.length)];
    
    const ipInfo: IpAddressDetail = {
        continentCode: selectedCountry.continent.substring(0, 2).toUpperCase(),
        continentName: selectedCountry.continent,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        latitude: selectedCountry.lat + (Math.random() - 0.5) * 10,
        longitude: selectedCountry.lon + (Math.random() - 0.5) * 10,
    };

    const isAccessible = Math.random() > 0.15; // 85% accessible
    const isPublic = Math.random() > 0.3; // 70% public
    
    const storageCommitted = 50 + Math.floor(Math.random() * 500); // 50-550 GB
    const storageUsed = storageCommitted * (0.3 + Math.random() * 0.6); // 30-90% used
    
    const accessibleNodeDetail = isAccessible ? {
        cpu_usage: 20 + Math.random() * 60, // 20-80%
        total_storage_size: storageCommitted * 1.2,
        packets_sent: Math.floor(Math.random() * 1000000),
        packets_received: Math.floor(Math.random() * 1000000),
        total_ram_available: 8 + Math.floor(Math.random() * 24), // 8-32 GB
        total_ram_used: 0,
        total_storage_allocated: storageUsed,
    } : undefined;

    if (accessibleNodeDetail) {
        accessibleNodeDetail.total_ram_used = accessibleNodeDetail.total_ram_available * (0.3 + Math.random() * 0.5);
    }

    const uptimeValue = 95 + Math.random() * 5; // 95-100%

    // Generate random credit value (100-600 range for mock data)
    // In real implementation, this would come from the actual leaf node data
    const credit = 100 + Math.floor(Math.random() * 500);

    return {
        pubkey: `Provider${String(index + 1).padStart(4, '0')}...${Math.random().toString(36).substring(2, 6)}`,
        is_registered: true,
        address: {
            endpoint: `https://provider-${index + 1}.xandeum.network`,
            ip_info: ipInfo,
        },
        accessible_node_detail: accessibleNodeDetail,
        is_accessible: isAccessible,
        is_public: isPublic,
        last_seen: true,
        storage_comitted: storageCommitted,
        storage_used: storageUsed,
        usage_percent: (storageUsed / storageCommitted) * 100,
        uptime: uptimeValue,
        version: parseFloat(version),
        credit: credit,
    };
};

export function aggregateLeafData(leaves: LeafMeta[]): ValidatorLeafNodeAggregatedData {
    const operators = leaves.length;
    const total_storage_comitted = leaves.reduce((sum, leaf) => sum + leaf.storage_comitted, 0);
    const total_storage_used = leaves.reduce((sum, leaf) => sum + leaf.storage_used, 0);
    const average_storage_per_pod = operators > 0 ? total_storage_comitted / operators : 0;
    const utilization_rate = total_storage_comitted > 0 ? (total_storage_used / total_storage_comitted) * 100 : 0;

    // Status counts
    const online_count = leaves.filter(l => l.is_accessible && l.last_seen).length;
    const offline_count = operators - online_count;
    const public_count = leaves.filter(l => l.is_public).length;
    const private_count = operators - public_count;
    const accessible_count = leaves.filter(l => l.is_accessible).length;
    const registered_count = leaves.filter(l => l.is_registered).length;

    // Credit stats
    const leavesWithCredits = leaves.filter(l => l.credit !== undefined);
    const total_credits_awarded = leavesWithCredits.reduce((sum, l) => sum + (l.credit || 0), 0);
    const average_credits_per_pod = leavesWithCredits.length > 0 ? total_credits_awarded / leavesWithCredits.length : 0;
    const credits = leavesWithCredits.map(l => l.credit || 0);
    const max_credits = credits.length > 0 ? Math.max(...credits) : 0;
    const min_credits = credits.length > 0 ? Math.min(...credits) : 0;

    // Get top 3 credit providers - sort by credit descending and take top 3
    const top_credit_providers = leavesWithCredits
        .sort((a, b) => (b.credit || 0) - (a.credit || 0))
        .slice(0, 3)
        .map((leaf, index) => ({
            pubkey: leaf.pubkey,
            credit: leaf.credit || 0,
            rank: index + 1 // 1, 2, 3
        }));

    // Country distribution
    const countryMap = new Map<string, { count: number; credits: number; flag: string }>();
    leaves.forEach(leaf => {
        if (leaf.address.ip_info) {
            const country = leaf.address.ip_info.countryName;
            const flag = getCountryFlag(leaf.address.ip_info.countryCode);
            const existing = countryMap.get(country) || { count: 0, credits: 0, flag };
            countryMap.set(country, {
                count: existing.count + 1,
                credits: existing.credits + (leaf.credit || 0),
                flag
            });
        }
    });

    const country_distribution = Array.from(countryMap.entries())
        .map(([country, data]) => ({
            country,
            count: data.count,
            flag: data.flag
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const credit_distribution_by_country = Array.from(countryMap.entries())
        .map(([country, data]) => ({
            country,
            credits: data.credits,
            flag: data.flag,
            avg_per_pod: data.count > 0 ? data.credits / data.count : 0
        }))
        .sort((a, b) => b.credits - a.credits)
        .slice(0, 5);

    // Performance metrics
    const average_uptime = leaves.reduce((sum, l) => sum + l.uptime, 0) / operators;
    const accessibleLeaves = leaves.filter(l => l.accessible_node_detail);
    const total_packets_sent = accessibleLeaves.reduce((sum, l) => sum + (l.accessible_node_detail?.packets_sent || 0), 0);
    const total_packets_received = accessibleLeaves.reduce((sum, l) => sum + (l.accessible_node_detail?.packets_received || 0), 0);
    const average_cpu_usage = accessibleLeaves.length > 0
        ? accessibleLeaves.reduce((sum, l) => sum + (l.accessible_node_detail?.cpu_usage || 0), 0) / accessibleLeaves.length
        : 0;
    const average_ram_usage = accessibleLeaves.length > 0
        ? accessibleLeaves.reduce((sum, l) => {
            const detail = l.accessible_node_detail;
            if (detail && detail.total_ram_available > 0) {
                return sum + (detail.total_ram_used / detail.total_ram_available) * 100;
            }
            return sum;
        }, 0) / accessibleLeaves.length
        : 0;

    return {
        operators,
        total_storage_comitted,
        total_storage_used,
        average_storage_per_pod,
        utilization_rate,
        online_count,
        offline_count,
        public_count,
        private_count,
        accessible_count,
        registered_count,
        total_credits_awarded,
        average_credits_per_pod,
        max_credits,
        min_credits,
        top_credit_providers,
        country_distribution,
        credit_distribution_by_country,
        average_uptime,
        total_packets_sent,
        total_packets_received,
        average_cpu_usage,
        average_ram_usage
    };
}

function getCountryFlag(countryCode: string): string {
    const flags: { [key: string]: string } = {
        'US': '🇺🇸',
        'GB': '🇬🇧',
        'DE': '🇩🇪',
        'JP': '🇯🇵',
        'SG': '🇸🇬',
        'AU': '🇦🇺',
        'CA': '🇨🇦',
        'FR': '🇫🇷',
        'BR': '🇧🇷',
        'IN': '🇮🇳'
    };
    return flags[countryCode] || '🌍';
}

export const formatBytes = (gb: number): string => {
    if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
    return `${gb.toFixed(0)} GB`;
};

export const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
};