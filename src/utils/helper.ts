import { IpAddressDetail, LeafMeta, ValidatorLeafNodeAggregatedData } from "src/types";

// Add this helper at the top
export const getCountryFlag = (countryCode: string): string => {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

// Add this export at the end of the file
export const generateLeafMeta = (index: number, version: string): LeafMeta => {
    const countries = [
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

    const selectedCountry = countries[Math.floor(Math.random() * countries.length)];
    
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

    // Calculate credits based on performance metrics
    const uptimeValue = 95 + Math.random() * 5; // 95-100%
    const utilizationFactor = (storageUsed / storageCommitted);
    const accessibilityBonus = isAccessible ? 1.2 : 0.8;
    const publicBonus = isPublic ? 1.1 : 1.0;
    const uptimeBonus = uptimeValue / 100;
    
    // Base credits: 100-500 based on storage committed
    const baseCredits = (storageCommitted / 550) * 400 + 100;
    const performanceMultiplier = utilizationFactor * accessibilityBonus * publicBonus * uptimeBonus;
    const credits = Math.floor(baseCredits * performanceMultiplier);

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
        credit: credits,
    };
};

export const aggregateLeafData = (leafMetas: LeafMeta[]): ValidatorLeafNodeAggregatedData => {
    if (leafMetas.length === 0) {
        return {
            operators: 0,
            total_storage_comitted: 0,
            total_storage_used: 0,
            average_storage_per_pod: 0,
            utilization_rate: 0,
            online_count: 0,
            offline_count: 0,
            public_count: 0,
            private_count: 0,
            accessible_count: 0,
            registered_count: 0,
            total_credits_awarded: 0,
            average_credits_per_pod: 0,
            max_credits: 0,
            min_credits: 0,
            top_credit_providers: [],
            country_distribution: [],
            credit_distribution_by_country: [],
            average_uptime: 0,
            total_packets_sent: 0,
            total_packets_received: 0,
            average_cpu_usage: 0,
            average_ram_usage: 0
        };
    }

    // Count statistics
    const online_count = leafMetas.filter(l => l.is_accessible && l.last_seen).length;
    const offline_count = leafMetas.length - online_count;
    const public_count = leafMetas.filter(l => l.is_public).length;
    const private_count = leafMetas.length - public_count;
    const accessible_count = leafMetas.filter(l => l.is_accessible).length;
    const registered_count = leafMetas.filter(l => l.is_registered).length;

    // Storage calculations
    const total_storage_comitted = leafMetas.reduce((sum, l) => sum + l.storage_comitted, 0);
    const total_storage_used = leafMetas.reduce((sum, l) => sum + l.storage_used, 0);
    const average_storage_per_pod = total_storage_comitted / leafMetas.length;
    const utilization_rate = (total_storage_used / total_storage_comitted) * 100;

    // Credit calculations - use the credit values from leaf nodes
    const credits = leafMetas.map(l => l.credit || 0);
    const total_credits_awarded = credits.reduce((sum, c) => sum + c, 0);
    const average_credits_per_pod = leafMetas.length > 0 ? total_credits_awarded / leafMetas.length : 0;
    const max_credits = credits.length > 0 ? Math.max(...credits) : 0;
    const min_credits = credits.length > 0 ? Math.min(...credits.filter(c => c > 0)) : 0;

    // Find top 3 providers by credits
    const sortedByCredit = [...leafMetas]
        .filter(l => l.credit !== undefined && l.credit > 0)
        .sort((a, b) => (b.credit || 0) - (a.credit || 0))
        .slice(0, 3);
    
    const top_credit_providers = sortedByCredit.map((leaf, index) => ({
        pubkey: leaf.pubkey,
        credit: leaf.credit || 0,
        rank: index + 1
    }));

    // Assign ranks to the leaf metas
    sortedByCredit.forEach((leaf, index) => {
        leaf.credit_rank = index + 1;
    });

    // Country distribution
    const countryMap = new Map<string, { count: number; code: string }>();
    leafMetas.forEach(l => {
        if (l.address.ip_info) {
            const country = l.address.ip_info.countryName;
            const code = l.address.ip_info.countryCode;
            const existing = countryMap.get(country);
            if (existing) {
                existing.count++;
            } else {
                countryMap.set(country, { count: 1, code });
            }
        }
    });

    const country_distribution = Array.from(countryMap.entries())
        .map(([country, data]) => ({
            country,
            count: data.count,
            flag: getCountryFlag(data.code)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 countries

    // Credit distribution by country - aggregate credits by country
    const creditByCountryMap = new Map<string, { credits: number; count: number; code: string }>();
    leafMetas.forEach(l => {
        if (l.address.ip_info && l.credit !== undefined) {
            const country = l.address.ip_info.countryName;
            const code = l.address.ip_info.countryCode;
            const existing = creditByCountryMap.get(country);
            if (existing) {
                existing.credits += l.credit;
                existing.count++;
            } else {
                creditByCountryMap.set(country, { credits: l.credit, count: 1, code });
            }
        }
    });

    const credit_distribution_by_country = Array.from(creditByCountryMap.entries())
        .map(([country, data]) => ({
            country,
            credits: data.credits,
            flag: getCountryFlag(data.code),
            avg_per_pod: data.credits / data.count
        }))
        .sort((a, b) => b.credits - a.credits)
        .slice(0, 5); // Top 5 countries by credits

    // Performance metrics
    const average_uptime = leafMetas.reduce((sum, l) => sum + l.uptime, 0) / leafMetas.length;

    const accessibleLeafs = leafMetas.filter(l => l.is_accessible && l.accessible_node_detail);
    const total_packets_sent = accessibleLeafs.reduce((sum, l) =>
        sum + (l.accessible_node_detail?.packets_sent || 0), 0);
    const total_packets_received = accessibleLeafs.reduce((sum, l) =>
        sum + (l.accessible_node_detail?.packets_received || 0), 0);
    const average_cpu_usage = accessibleLeafs.length > 0
        ? accessibleLeafs.reduce((sum, l) => sum + (l.accessible_node_detail?.cpu_usage || 0), 0) / accessibleLeafs.length
        : 0;
    const average_ram_usage = accessibleLeafs.length > 0
        ? accessibleLeafs.reduce((sum, l) => {
            const detail = l.accessible_node_detail;
            if (!detail) return sum;
            return sum + (detail.total_ram_used / detail.total_ram_available * 100);
        }, 0) / accessibleLeafs.length
        : 0;

    return {
        operators: leafMetas.length,
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
};