import { useRef, useEffect, SetStateAction, Dispatch, useMemo } from 'react';
import * as d3 from 'd3';
import { NodeData, LinkData, Validator, LeafMeta, ValidatorLeafNodeAggregatedData, RootNode } from '../types';
import { validators } from '../data/validators';
import { aggregateLeafData, setAutoClearingTimeout } from '../utils/helper';

interface NetworkGraphProps {
    isDark: boolean;
    isVisible: boolean;
    onValidatorHover: (validator: Validator | null, aggregatedData?: ValidatorLeafNodeAggregatedData) => void;
    onLeafHover: (leaf: LeafMeta | null) => void;
    onRootDataCalculated: Dispatch<SetStateAction<{
        total_pods: number;
        total_storage_committed: number;
        total_storage_used: number;
        average_storage_per_pod: number;
        utilization_rate: number;
        total_credits?: number;
    } | undefined>>;
    onLeavesGenerated: (leaves: LeafMeta[]) => void;
    externalLeafData?: LeafMeta[];
    highlightEndpoints?: string[];
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
    isDark,
    isVisible,
    onValidatorHover,
    onLeafHover,
    onRootDataCalculated,
    onLeavesGenerated,
    externalLeafData = [],
    highlightEndpoints = []
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<d3.Simulation<NodeData, LinkData> | null>(null);
    const nodesRef = useRef<NodeData[]>([]);
    const linksRef = useRef<LinkData[]>([]);

    const COLORS = useMemo(() => ({
        bg: isDark ? '#0a0e1a' : '#f8fafc',
        purple: '#9945FF',
        green: '#14F195',
        cyan: '#00D4FF',
        highlight: '#F08C56',
        gray: isDark ? '#E5E7EB' : '#1f2937',
        leafDefault: '#14F195',
        leafGlow: '#00D4FF'
    }), [isDark]);

    // Memoize the validator-leaf mapping
    const validatorLeafMap = useMemo(() => {
        const map = new Map<string, LeafMeta[]>();

        externalLeafData.forEach((leaf) => {
            const matchingValidator = validators.find(v => {
                if (leaf.version === v.version) return true;
                const majorMinor = String(leaf.version).match(/^(\d+\.\d+)/)?.[1];
                if (majorMinor === v.version) return true;
                if (String(leaf.version).startsWith(v.version)) return true;
                return false;
            });

            const validatorVersion = matchingValidator?.version || 'custom';
            if (!map.has(validatorVersion)) {
                map.set(validatorVersion, []);
            }
            map.get(validatorVersion)!.push(leaf);
        });

        return map;
    }, [externalLeafData]);

    // Memoize nodes and links generation
    const { nodes, links } = useMemo(() => {
        if (!containerRef.current) return { nodes: [], links: [] };

        const width = containerRef.current.offsetWidth || 800;
        const height = containerRef.current.offsetHeight || 600;

        const nodes: NodeData[] = [];
        const links: LinkData[] = [];

        const centerNode: NodeData = {
            id: 'ROOT',
            type: 'center',
            fx: width / 2,
            fy: height / 2,
            r: 60
        };
        nodes.push(centerNode);

        let minValidatorStorage = Infinity;
        let maxValidatorStorage = -Infinity;
        let minLeafStorage = Infinity;
        let maxLeafStorage = -Infinity;

        validatorLeafMap.forEach((validatorLeaves) => {
            const aggregatedData = aggregateLeafData(validatorLeaves);
            const storageSize = aggregatedData.total_storage_committed;
            minValidatorStorage = Math.min(minValidatorStorage, storageSize);
            maxValidatorStorage = Math.max(maxValidatorStorage, storageSize);

            validatorLeaves.forEach((leaf) => {
                minLeafStorage = Math.min(minLeafStorage, leaf.storage_committed);
                maxLeafStorage = Math.max(maxLeafStorage, leaf.storage_committed);
            });
        });

        if (minValidatorStorage === Infinity || maxValidatorStorage === -Infinity || minValidatorStorage === maxValidatorStorage) {
            minValidatorStorage = 2000;
            maxValidatorStorage = 20000;
        }

        if (minLeafStorage === Infinity || maxLeafStorage === -Infinity || minLeafStorage === maxLeafStorage) {
            minLeafStorage = 50;
            maxLeafStorage = 550;
        }

        let clusterIndex = 0;
        validatorLeafMap.forEach((validatorLeaves, validatorVersion) => {
            const val = validators.find(v => v.version === validatorVersion);
            if (!val) return;

            const clusterId = `val-${clusterIndex}`;
            const angle = (clusterIndex / validatorLeafMap.size) * 2 * Math.PI;
            const radius = 60;

            const aggregatedData = aggregateLeafData(validatorLeaves);
            const validatorStorageSize = aggregatedData.total_storage_committed;

            const minRadius = 30;
            const maxRadius = 50;
            const validatorRadius = minRadius + ((validatorStorageSize - minValidatorStorage) / (maxValidatorStorage - minValidatorStorage)) * (maxRadius - minRadius);
            const clampedRadius = Math.max(minRadius, Math.min(maxRadius, validatorRadius));

            const validatorNode: NodeData = {
                id: clusterId,
                type: 'validator',
                name: val.name,
                meta: val,
                fx: width / 2 + Math.cos(angle) * radius,
                fy: height / 2 + Math.sin(angle) * radius,
                r: clampedRadius,
                aggregatedData
            };
            nodes.push(validatorNode);
            links.push({ source: 'ROOT', target: clusterId, type: 'primary' });

            const leafCount = validatorLeaves.length;
            const minLeafCount = 25;
            const maxLeafCount = 45;
            const maxDistance = 250;
            const minDistance = 180;
            const baseDistance = maxDistance - ((Math.min(leafCount, maxLeafCount) - minLeafCount) / (maxLeafCount - minLeafCount)) * (maxDistance - minDistance);

            const minArcSpread = Math.PI / 6;
            const maxArcSpread = Math.PI / 3.5;
            const arcSpread = minArcSpread + ((Math.min(leafCount, maxLeafCount) - minLeafCount) / (maxLeafCount - minLeafCount)) * (maxArcSpread - minArcSpread);

            const numLevels = 6;
            const leavesPerLevel = Math.ceil(leafCount / numLevels);

            validatorLeaves.forEach((leafMeta, j) => {
                const level = Math.floor(j / leavesPerLevel);
                const indexInLevel = j % leavesPerLevel;
                const totalInLevel = Math.min(leavesPerLevel, leafCount - level * leavesPerLevel);

                const levelDistance = baseDistance + (level * 35);
                const leafAngleOffset = (indexInLevel / Math.max(totalInLevel - 1, 1)) * arcSpread - arcSpread / 2;
                const leafAngle = angle + leafAngleOffset;

                const minBoxSize = 8;
                const maxBoxSize = 16;
                const leafBoxSize = minBoxSize + ((leafMeta.storage_committed - minLeafStorage) / (maxLeafStorage - minLeafStorage)) * (maxBoxSize - minBoxSize);
                const clampedBoxSize = Math.max(minBoxSize, Math.min(maxBoxSize, leafBoxSize));

                nodes.push({
                    id: `${clusterId}-leaf-${j}`,
                    type: 'leaf',
                    parent: validatorNode,
                    leafMeta: leafMeta,
                    r: clampedBoxSize / 2,
                    x: validatorNode.fx! + Math.cos(leafAngle) * levelDistance,
                    y: validatorNode.fy! + Math.sin(leafAngle) * levelDistance,
                    leafDistance: levelDistance
                });
                links.push({ source: clusterId, target: `${clusterId}-leaf-${j}`, type: 'leaf' });
            });

            clusterIndex++;
        });

        return { nodes, links };
    }, [validatorLeafMap]);

    useEffect(() => {
        const allLeafMetas = Array.from(validatorLeafMap.values()).flat();
        const rootAggregatedData = aggregateLeafData(allLeafMetas);
        onRootDataCalculated({
            total_pods: allLeafMetas.length,
            total_storage_committed: rootAggregatedData.total_storage_committed,
            total_storage_used: rootAggregatedData.total_storage_used,
            average_storage_per_pod: rootAggregatedData.average_storage_per_pod,
            utilization_rate: rootAggregatedData.utilization_rate,
            total_credits: rootAggregatedData.total_credits_awarded
        });
        onLeavesGenerated(allLeafMetas);
    }, [validatorLeafMap, onRootDataCalculated, onLeavesGenerated]);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        const leafBoxes = svg.selectAll('.leaf-box');

        leafBoxes
            .attr('stroke', function (d: any) {
                const nodeData = d as NodeData;
                if (nodeData.leafMeta && highlightEndpoints.includes(nodeData.leafMeta.address.endpoint)) {
                    return '#FF00A8';
                }
                if (nodeData.leafMeta?.credit_rank === 1) return '#FFA500';
                if (nodeData.leafMeta?.credit_rank === 2) return '#E5E5E5';
                if (nodeData.leafMeta?.credit_rank === 3) return '#8B4513';
                return 'none';
            })
            .attr('stroke-width', function (d: any) {
                const nodeData = d as NodeData;
                if (nodeData.leafMeta && highlightEndpoints.includes(nodeData.leafMeta.address.endpoint)) {
                    return 4;
                }
                return nodeData.leafMeta?.credit_rank ? 2 : 0;
            })
            .style('filter', function (d: any) {
                const nodeData = d as NodeData;
                if (nodeData.leafMeta && highlightEndpoints.includes(nodeData.leafMeta.address.endpoint)) {
                    return 'drop-shadow(0 0 12px #FF00A8)';
                }
                if (nodeData.leafMeta?.credit_rank === 1) return 'drop-shadow(0 0 8px #FFD700)';
                if (nodeData.leafMeta?.credit_rank === 2) return 'drop-shadow(0 0 6px #C0C0C0)';
                if (nodeData.leafMeta?.credit_rank === 3) return 'drop-shadow(0 0 4px #CD7F32)';
                return 'none';
            });
    }, [highlightEndpoints, nodes]);

    useEffect(() => {
        if (!containerRef.current || !svgRef.current || nodes.length === 0) return;

        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;

        nodesRef.current = nodes;
        linksRef.current = links;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        // Define gradients and filters
        const defs = svg.append('defs');

        // Xandeum logo gradient
        const logoGradient = defs
            .append('linearGradient')
            .attr('id', 'solanaGradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%');
        logoGradient.append('stop').attr('offset', '0%').attr('stop-color', '#14F195');
        logoGradient.append('stop').attr('offset', '50%').attr('stop-color', '#9945FF');
        logoGradient.append('stop').attr('offset', '100%').attr('stop-color', '#00D4FF');

        // Reduced glow filter
        const glowFilter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
        glowFilter.append('feGaussianBlur').attr('stdDeviation', '1.5').attr('result', 'coloredBlur');
        const feMerge = glowFilter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        const strongGlow = defs.append('filter').attr('id', 'strongGlow').attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
        strongGlow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
        const feMerge2 = strongGlow.append('feMerge');
        feMerge2.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge2.append('feMergeNode').attr('in', 'SourceGraphic');

        // Drop shadow
        const dropShadow = defs.append('filter').attr('id', 'dropShadow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
        dropShadow.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', '2');
        dropShadow.append('feOffset').attr('dx', '0').attr('dy', '1').attr('result', 'offsetblur');
        dropShadow.append('feComponentTransfer').append('feFuncA').attr('type', 'linear').attr('slope', '0.2');
        const feMerge3 = dropShadow.append('feMerge');
        feMerge3.append('feMergeNode');
        feMerge3.append('feMergeNode').attr('in', 'SourceGraphic');

        // Create gradients for each validator
        validators.forEach((val, i) => {
            const grad = defs.append('radialGradient').attr('id', `valGrad-${i}`);
            grad.append('stop').attr('offset', '0%').attr('stop-color', val.color).attr('stop-opacity', '1');
            grad.append('stop').attr('offset', '100%').attr('stop-color', val.color).attr('stop-opacity', '0.4');
        });

        const g = svg.append('g');

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.4, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));
        svg.call(zoom);

        // Simulation with reduced alpha decay for faster settling
        const simulation = d3.forceSimulation<NodeData>(nodes)
            .force('link', d3.forceLink<NodeData, LinkData>(links)
                .id((d) => d.id)
                .distance((d) => {
                    if (d.type === 'leaf') {
                        const target = d.target as NodeData;
                        return (target as any).leafDistance || 200;
                    }
                    return 1;
                })
                .strength((d) => (d.type === 'leaf' ? 0.9 : 0))
            )
            .force('charge', d3.forceManyBody<NodeData>().strength((d) => {
                if (d.type === 'leaf') return -2;
                return 0;
            }))
            .force('collide', d3.forceCollide<NodeData>()
                .radius((d) => (d.type === 'leaf' ? 6 : 0))
                .iterations(3)
            )
            .alphaDecay(0.05); // Increased from 0.03 for faster settling

        simulationRef.current = simulation;

        // Draw links
        const link = g.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', isDark ? 'rgba(100, 100, 100, 0.3)' : 'rgba(150, 150, 150, 0.2)')
            .attr('stroke-width', (d) => (d.type === 'primary' ? 0 : 0.6))
            .attr('stroke-opacity', (d) => (d.type === 'primary' ? 0 : 0.5));

        // Draw nodes
        const node = g.append('g')
            .selectAll('g')
            .data(nodes)
            .join('g')
            .attr('class', 'node')
            .style('cursor', 'pointer');

        // Validator nodes
        const valGroup = node.filter((d: NodeData) => d.type === 'validator');
        valGroup.append('circle')
            .attr('r', (d) => (d.r || 26) + 6)
            .attr('fill', (d, i) => `url(#valGrad-${i})`)
            .attr('opacity', 0.15);

        const bgFill = isDark ? 'rgba(10, 14, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        valGroup
            .append('circle')
            .attr('r', (d) => d.r || 26)
            .attr('fill', bgFill)
            .attr('stroke', (d) => d.meta!.color)
            .attr('stroke-width', 2.5)
            .attr('class', 'val-circle')
            .style('filter', 'url(#dropShadow)');

        // Inner gradient overlay
        valGroup.append('circle')
            .attr('r', (d) => (d.r || 26) - 2)
            .attr('fill', (d, i) => `url(#valGrad-${i})`)
            .attr('opacity', 0.1);

        // Xandeum node image - scaled to validator size
        valGroup
            .append('image')
            .attr('href', '/assets/xandeum-node.png')
            .attr('x', (d) => -(d.r || 26) * 0.6)
            .attr('y', (d) => -(d.r || 26) * 0.6)
            .attr('width', (d) => (d.r || 26) * 1.2)
            .attr('height', (d) => (d.r || 26) * 1.2)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('pointer-events', 'none');

        // 3D leaf nodes
        const leafGroup = node.filter((d) => d.type === 'leaf');

        leafGroup.each(function (d, i) {
            const g = d3.select(this);
            const boxSize = (d.r || 6) * 2; // Use calculated size
            const depth = boxSize / 3;

            const parentColor = d.parent?.meta?.color || COLORS.cyan;

            // Focus circle (hidden by default) - offset for 3D perspective
            g.append('circle')
                .attr('cx', depth / 2)
                .attr('cy', -depth / 2)
                .attr('r', boxSize * 1.5)
                .attr('fill', 'none')
                .attr('stroke', COLORS.highlight)
                .attr('stroke-width', 2)
                .attr('opacity', 0)
                .attr('class', 'leaf-focus');

            // Subtle shadow
            g.append('ellipse')
                .attr('cx', 1)
                .attr('cy', boxSize / 2 + 2)
                .attr('rx', boxSize / 2)
                .attr('ry', 1.5)
                .attr('fill', '#000')
                .attr('opacity', 0.2);

            // Top face
            g.append('path')
                .attr('d', `M ${-boxSize / 2} ${-boxSize / 2} 
                                   L ${boxSize / 2} ${-boxSize / 2} 
                                   L ${boxSize / 2 + depth} ${-boxSize / 2 - depth} 
                                   L ${-boxSize / 2 + depth} ${-boxSize / 2 - depth} Z`)
                .attr('fill', d3.color(parentColor)?.darker(0.5)?.toString() || '#14F195')
                .attr('opacity', 0.8)
                .attr('class', 'leaf-box');

            // Right face
            g.append('path')
                .attr('d', `M ${boxSize / 2} ${-boxSize / 2} 
                                   L ${boxSize / 2} ${boxSize / 2} 
                                   L ${boxSize / 2 + depth} ${boxSize / 2 - depth} 
                                   L ${boxSize / 2 + depth} ${-boxSize / 2 - depth} Z`)
                .attr('fill', d3.color(parentColor)?.darker(0.8)?.toString() || '#0ea86e')
                .attr('opacity', 0.75)
                .attr('class', 'leaf-box');

            // Front face
            const boxGrad = defs.append('linearGradient').attr('id', `boxGrad-${i}`);
            boxGrad.append('stop').attr('offset', '0%').attr('stop-color', parentColor);
            boxGrad.append('stop').attr('offset', '100%').attr('stop-color', d3.color(parentColor)?.darker(0.3)?.toString() || COLORS.cyan);

            g.append('rect')
                .attr('x', -boxSize / 2)
                .attr('y', -boxSize / 2)
                .attr('width', boxSize)
                .attr('height', boxSize)
                .attr('rx', 1)
                .attr('fill', `url(#boxGrad-${i})`)
                .attr('opacity', 0.9)
                .attr('class', 'leaf-box');

            // Highlight edge
            g.append('line')
                .attr('x1', -boxSize / 2)
                .attr('y1', -boxSize / 2)
                .attr('x2', boxSize / 2)
                .attr('y2', -boxSize / 2)
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.4)
                .attr('opacity', 0.4)
                .attr('class', 'leaf-box');

            // Add subtle bounce animation to leaf boxes
            const bounceAnimation = () => {
                g.selectAll('.leaf-box, .leaf-focus, ellipse')
                    .transition()
                    .duration(800 + Math.random() * 400)
                    .ease(d3.easeCubicOut)
                    .attr('transform', 'translate(0, -3) scale(1.05)')
                    .transition()
                    .duration(800 + Math.random() * 400)
                    .ease(d3.easeBounceOut)
                    .attr('transform', 'translate(0, 0) scale(1)')
                    .on('end', bounceAnimation);
            };
            // Start bounce with offset for variation
            setAutoClearingTimeout(() => bounceAnimation(), Math.random() * 2000);
        });
        leafGroup.append('rect')
            .attr('class', 'leaf-box')
            .attr('width', d => (d.r || 6) * 2)
            .attr('height', d => (d.r || 6) * 2)
            .attr('x', d => -(d.r || 6))
            .attr('y', d => -(d.r || 6))
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('fill', (d) => {
                if (!d.leafMeta) return COLORS.leafDefault;
                // Special colors for top 3 credit holders
                if (d.leafMeta.credit_rank === 1) return '#FFD700'; // Gold
                if (d.leafMeta.credit_rank === 2) return '#C0C0C0'; // Silver
                if (d.leafMeta.credit_rank === 3) return '#CD7F32'; // Bronze
                // Regular colors based on status
                if (d.leafMeta.is_online) return '#10B981'; // Green for online
                if (d.leafMeta.is_accessible) return '#3B82F6'; // Blue for accessible
                return '#6B7280'; // Gray for offline
            })
            .attr('opacity', (d) => {
                if (d.leafMeta?.credit_rank) return 1; // Full opacity for top 3
                return d.leafMeta?.is_accessible ? 0.8 : 0.4;
            })
            .attr('stroke', (d) => {
                if (d.leafMeta?.credit_rank === 1) return '#FFA500'; // Orange glow for gold
                if (d.leafMeta?.credit_rank === 2) return '#E5E5E5'; // White glow for silver
                if (d.leafMeta?.credit_rank === 3) return '#8B4513'; // Brown glow for bronze
                return 'none';
            })
            .attr('stroke-width', (d) => d.leafMeta?.credit_rank ? 2 : 0)
            .style('filter', (d) => {
                if (d.leafMeta?.credit_rank === 1) return 'drop-shadow(0 0 8px #FFD700)';
                if (d.leafMeta?.credit_rank === 2) return 'drop-shadow(0 0 6px #C0C0C0)';
                if (d.leafMeta?.credit_rank === 3) return 'drop-shadow(0 0 4px #CD7F32)';
                return 'none';
            });

        // Add rank badge for top 3
        leafGroup.filter(d => d.leafMeta?.credit_rank !== undefined)
            .append('text')
            .attr('class', 'rank-badge')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .attr('fill', (d) => {
                if (d.leafMeta?.credit_rank === 1) return '#000';
                return '#fff';
            })
            .text(d => {
                if (d.leafMeta?.credit_rank === 1) return '👑';
                if (d.leafMeta?.credit_rank === 2) return '🥈';
                if (d.leafMeta?.credit_rank === 3) return '🥉';
                return '';
            });

        // Add pulsing animation for top 3
        leafGroup.filter(d => d.leafMeta?.credit_rank !== undefined)
            .select('.leaf-box')
            .style('animation', 'pulse 2s ease-in-out infinite');

        // Center node
        const centerGroup = node.filter((d: NodeData) => d.type === 'center');
        centerGroup.raise();
        centerGroup.append('circle')
            .attr('r', 60)
            .attr('fill', isDark ? '#0a0e1a' : '#ffffff')
            .attr('stroke', 'url(#solanaGradient)')
            .attr('stroke-width', 1.5);

        // Xandeum logo image on top with subtle rotation
        centerGroup.append('image')
            .attr('href', '/assets/xandeum-network.png')
            .attr('x', -40)
            .attr('y', -40)
            .attr('width', 80)
            .attr('height', 80)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Mouse events
        node.on('mouseenter', function (event, d) {
            // First, clear ALL hover effects from all nodes
            node.selectAll('.leaf-focus')
                .interrupt()
                .transition().duration(100)
                .attr('opacity', 0);

            node.selectAll('.leaf-box')
                .interrupt()
                .transition().duration(100)
                .attr('transform', 'translate(0, 0) scale(1)');

            valGroup.select('.val-circle')
                .interrupt()
                .transition().duration(100)
                .attr('r', (d) => d.r || 26)
                .attr('stroke-width', 2.5);

            // Handle center node
            if (d.type === 'center') {
                // Clear validator and leaf hover states
                onValidatorHover(null);
                onLeafHover(null);

                return;
            }

            // Update hover state
            if (d.type === 'validator') {
                onValidatorHover(d.meta!, d.aggregatedData);
                onLeafHover(null);
            } else if (d.type === 'leaf') {
                onLeafHover(d.leafMeta!);
                onValidatorHover(null);
            }

            const activeCluster = d.type === 'validator' ? d : d.parent!;
            const activeValidatorNode = node.filter((n) => n === activeCluster);
            activeValidatorNode.raise();

            // Show focus circle for leaf nodes
            if (d.type === 'leaf') {
                d3.select(this).select('.leaf-focus')
                    .interrupt()
                    .transition().duration(200)
                    .attr('opacity', 0.8);

                // Slightly enlarge the leaf
                d3.select(this).selectAll('.leaf-box')
                    .interrupt()
                    .transition().duration(200)
                    .attr('transform', 'translate(0, -3) scale(1.3)');
            }

            // Subtle fade
            node.interrupt().transition().duration(200).style('opacity', 0.3);
            link.interrupt().transition().duration(200).style('opacity', 0.1);

            const activeNodes = node.filter((n) => n === activeCluster || n.parent === activeCluster || n.type === 'center' || n === d);
            activeNodes.interrupt().transition().duration(200).style('opacity', 1);

            const activeLinks = link.filter(
                (l: any) => l.source === activeCluster || (l.target === activeCluster && l.source.id === 'ROOT') || l.target === d
            );
            activeLinks.interrupt().transition().duration(200).style('opacity', 0.6).attr('stroke', COLORS.highlight).attr('stroke-width', 1);

            // Validator enhancement
            if (d.type === 'validator') {
                node.filter((n) => n === activeCluster).select('.val-circle')
                    .interrupt()
                    .transition().duration(200)
                    .attr('r', (d.r || 26) + 2)
                    .attr('stroke-width', 3);
            }
        });

        node.on('mouseleave', function (event, d) {
            // Don't clear hover state when leaving center node
            if (d.type === 'center') {
                return;
            }

            // Hide focus circle for leaf nodes
            if (d.type === 'leaf') {
                d3.select(this).select('.leaf-focus')
                    .interrupt()
                    .transition().duration(200)
                    .attr('opacity', 0);

                d3.select(this).selectAll('.leaf-box')
                    .interrupt()
                    .transition().duration(200)
                    .attr('transform', 'translate(0, 0) scale(1)');
            }

            const centerNode = node.filter((n) => n.type === 'center');
            centerNode.raise();

            node.interrupt().transition().duration(300).style('opacity', 1);
            link.interrupt().transition().duration(300)
                .style('opacity', 0.5)
                .attr('stroke', isDark ? 'rgba(100, 100, 100, 0.3)' : 'rgba(150, 150, 150, 0.2)')
                .attr('stroke-width', 0.6);

            valGroup.select('.val-circle')
                .interrupt()
                .transition().duration(300)
                .attr('r', (d) => d.r || 26)
                .attr('stroke-width', 2.5);
        });

        // Simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            node.attr('transform', (d) => `translate(${d.x},${d.y})`);
        });

        // Stop simulation after it settles
        simulation.on('end', () => {
            console.log('Simulation settled');
        });

        return () => {
            simulation.stop();
        };
    }, [nodes, links, isDark, COLORS, onValidatorHover, onLeafHover]);

    const bgClass = isDark
        ? 'bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#1a0f2e]'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100';

    return (
        <div ref={containerRef} className={`flex-grow relative ${bgClass} ${isVisible ? 'block' : 'hidden'}`}>
            <svg ref={svgRef} width="100%" height="100%" />
            {isDark && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl"></div>
                </div>
            )}
        </div>
    );
};