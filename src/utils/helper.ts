import { LeafMeta, ValidatorLeafNodeAggregatedData } from "src/types";

export const getCountryFlag = (countryCode: string): string => {
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

export const aggregateLeafData = (leafMetas: LeafMeta[]): ValidatorLeafNodeAggregatedData => {
    const operators = leafMetas.length;
    const total_storage_committed = leafMetas.reduce((sum, leaf) => sum + leaf.storage_committed, 0);
    const total_storage_used = leafMetas.reduce((sum, leaf) => sum + leaf.storage_used, 0);
    const average_storage_per_pod = operators > 0 ? total_storage_committed / operators : 0;
    const utilization_rate = total_storage_committed > 0 ? (total_storage_used / total_storage_committed) * 100 : 0;

    // Status counts
    const online_count = leafMetas.filter(l => l.is_accessible && l.last_seen).length;
    const offline_count = operators - online_count;
    const public_count = leafMetas.filter(l => l.is_public).length;
    const private_count = operators - public_count;
    const accessible_count = leafMetas.filter(l => l.is_accessible).length;
    const registered_count = leafMetas.filter(l => l.is_registered).length;

    // Credit stats
    const leavesWithCredits = leafMetas.filter(l => l.credit !== undefined);
    const total_credits_awarded = leavesWithCredits.reduce((sum, l) => sum + (l.credit || 0), 0);
    const average_credits_per_pod = leavesWithCredits.length > 0 ? total_credits_awarded / leavesWithCredits.length : 0;
    const credits = leavesWithCredits.map(l => l.credit || 0);
    const max_credits = credits.length > 0 ? Math.max(...credits) : 0;
    const min_credits = credits.length > 0 ? Math.min(...credits) : 0;

    // Get top 3 credit providers
    const sortedByCredit = [...leavesWithCredits].sort((a, b) => (b.credit || 0) - (a.credit || 0));
    const top_credit_providers = sortedByCredit.slice(0, 3).map((leaf, index) => ({
        pubkey: leaf.pubkey,
        credit: leaf.credit || 0,
        rank: index + 1
    }));

    // Country distribution
    const countryMap = new Map<string, { count: number; credits: number; flag: string }>();
    leafMetas.forEach(leaf => {
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

    // Performance metrics - uptime is now in milliseconds
    const average_uptime = leafMetas.reduce((sum, l) => sum + l.uptime, 0) / operators;
    const accessibleLeaves = leafMetas.filter(l => l.accessible_node_detail);
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
        total_storage_committed,
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

export function shortenName(name: string) {
    // Solana public keys are 32-44 characters long and base58 encoded
    // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    
    // Only shorten if it looks like a Solana public key
    if (base58Regex.test(name)) {
        const SLICE = 8;
        return name.slice(0, SLICE) + '...' + name.slice(-SLICE);
    }
    
    // Return the name as-is if it's not a public key
    return name;
}

export const formatBytes = (bytes: number): string => {
    const TB = 1024 * 1024 * 1024 * 1024;
    const GB = 1024 * 1024 * 1024;
    const MB = 1024 * 1024;
    const KB = 1024;

    if (bytes >= TB) return `${(bytes / TB).toFixed(2)} TB`;
    if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
    if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
    if (bytes >= KB) return `${(bytes / KB).toFixed(2)} KB`;
    return `${bytes} B`;
};

export const formatUptime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
    if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
};

export const getUptimePercentage = (uptime: number, maxUptime: number = 30 * 24 * 60 * 60 * 1000): number => {
    // Assuming max uptime is 30 days in milliseconds
    return Math.min((uptime / maxUptime) * 100, 100);
};

export const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 0) return `${seconds}s ago`;
    return 'Just now';
};

export const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
};