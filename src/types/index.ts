import * as d3 from 'd3';

export interface RootNode {
    total_pods: number;
    total_storage_comitted: number;
    total_storage_used: number;
    average_storage_per_pod: number;
    utilization_rate: number;
    total_credits?: number;
}

export interface Validator {
    name: string;
    version: string;
    color: string;
    description: string;
    docsLink: string;
}

export interface ValidatorLeafNodeAggregatedData {
    operators: number;
    total_storage_comitted: number;
    total_storage_used: number;
    average_storage_per_pod: number;
    utilization_rate: number;
    // Distribution stats
    online_count: number;
    offline_count: number;
    public_count: number;
    private_count: number;
    accessible_count: number;
    registered_count: number;
    // Credit stats
    total_credits_awarded: number;
    average_credits_per_pod: number;
    max_credits: number;
    min_credits: number;
    top_credit_providers: Array<{ pubkey: string; credit: number; rank: number }>; // Top 3 by credits
    // Country distribution
    country_distribution: { country: string; count: number; flag: string }[];
    credit_distribution_by_country: { country: string; credits: number; flag: string; avg_per_pod: number }[];
    // Performance metrics
    average_uptime: number;
    total_packets_sent: number;
    total_packets_received: number;
    average_cpu_usage: number;
    average_ram_usage: number;
}

export interface LeafMeta {
    pubkey: string;
    is_registered: boolean;
    address: {
        endpoint: string;
        ip_info?: IpAddressDetail;
    };
    accessible_node_detail?: {
        cpu_usage: number;
        total_storage_size: number;
        packets_sent: number;
        packets_received: number;
        total_ram_available: number;
        total_ram_used: number;
        total_storage_allocated: number;
    };
    is_accessible: boolean;
    is_public: boolean;
    last_seen: boolean;
    storage_comitted: number;
    storage_used: number;
    usage_percent: number;
    uptime: number;
    version: number;
    credit?: number;
    credit_rank?: number;
}

export interface IpAddressDetail {
    continentCode: string;
    continentName: string;
    countryCode: string;
    countryName: string;
    latitude: number;
    longitude: number;
}

export interface NodeData extends d3.SimulationNodeDatum {
    id: string;
    type: 'center' | 'validator' | 'leaf';
    name?: string;
    meta?: Validator;
    leafMeta?: LeafMeta;
    parent?: NodeData;
    r?: number;
    fx?: number;
    fy?: number;
    leafDistance?: number;
    aggregatedData?: ValidatorLeafNodeAggregatedData;
}

export interface LinkData extends d3.SimulationLinkDatum<NodeData> {
    type: 'primary' | 'leaf';
}

export interface ColorScheme {
    bg: string;
    purple: string;
    green: string;
    cyan: string;
    highlight: string;
    gray: string;
    leafDefault: string;
    leafGlow: string;
}