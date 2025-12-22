import { LeafMeta, ValidatorLeafNodeAggregatedData } from '../types';

export function aggregateLeafData(leaves: LeafMeta[]): ValidatorLeafNodeAggregatedData {
    const operators = leaves.length;
    const total_storage_committed = leaves.reduce((sum, leaf) => sum + leaf.storage_committed, 0);
    const total_storage_used = leaves.reduce((sum, leaf) => sum + leaf.storage_used, 0);
    const average_storage_per_pod = operators > 0 ? total_storage_committed / operators : 0;
    const utilization_rate = total_storage_committed > 0 ? (total_storage_used / total_storage_committed) * 100 : 0;

    // Status counts
    const online_count = leaves.filter(l => l.is_online).length;
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

