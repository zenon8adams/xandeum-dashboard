import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { LeafMeta } from '../types';
import { validators } from '../data/validators';

interface WorldMapViewProps {
    isDark: boolean;
    isVisible: boolean;
    allLeaves: LeafMeta[];
    onLeafHover: (leaf: LeafMeta | null) => void;
    selectedLeaf: LeafMeta | null;
    highlightEndpoints?: string[];
}

export const WorldMapView: React.FC<WorldMapViewProps> = ({
    isDark,
    isVisible,
    allLeaves,
    onLeafHover,
    selectedLeaf,
    highlightEndpoints = []
}) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const rootRef = useRef<am5.Root | null>(null);
    const pointSeriesRef = useRef<am5map.MapPointSeries | null>(null);

    const locationMap = useMemo(() => {
        const locationMap = new Map<string, LeafMeta[]>();
        allLeaves.forEach((leaf) => {
            if (leaf.address.ip_info) {
                const key = `${leaf.address.ip_info.latitude},${leaf.address.ip_info.longitude}`;
                if (!locationMap.has(key)) {
                    locationMap.set(key, []);
                }
                locationMap.get(key)!.push(leaf);
            }
        });

        return locationMap;
    }, [allLeaves]);

    const baseMapData = useMemo(() => {
        const mapData: any[] = [];
        locationMap.forEach((leaves, key) => {
            const firstLeaf = leaves[0];
            if (firstLeaf.address.ip_info) {
                const totalCredits = leaves.reduce((sum, l) => sum + (l.credit || 0), 0);
                const onlineCount = leaves.filter(l => l.is_online).length;

                const validatorVersion = leaves[0].version;
                const validator = validators.find(v => {
                    if (v.version === validatorVersion) return true;
                    const majorMinor = String(validatorVersion).match(/^(\d+\.\d+)/)?.[1];
                    if (majorMinor === v.version) return true;
                    if (String(validatorVersion).startsWith(v.version)) return true;
                    return false;
                });

                mapData.push({
                    latitude: firstLeaf.address.ip_info.latitude,
                    longitude: firstLeaf.address.ip_info.longitude,
                    title: `${firstLeaf.address.ip_info.countryName}`,
                    info: `${leaves.length} nodes\n${onlineCount} online\n${totalCredits.toLocaleString()} credits`,
                    color: validator ? validator.color : '#6B7280',
                    nodes: leaves,
                });
            }
        });

        return mapData;
    }, [locationMap]);

    useLayoutEffect(() => {
        if (!pointSeriesRef.current || !highlightEndpoints) return;

        const pointSeries = pointSeriesRef.current;

        pointSeries.dataItems.forEach(dataItem => {
            const data = dataItem.dataContext as any;
            if (data && data.nodes) {
                const isHighlighted = data.nodes.some((l: LeafMeta) =>
                    highlightEndpoints.includes(l.address.endpoint)
                );

                const bullet = dataItem.bullets?.[0];
                if (bullet) {
                    const sprite = bullet.get('sprite');
                    if (sprite instanceof am5.Container) {
                        const circle = sprite.children.getIndex(0);
                        if (circle instanceof am5.Circle) {
                            circle.setAll({
                                fill: am5.color(isHighlighted ? 0xff00a8 : 0x9945ff),
                                strokeWidth: isHighlighted ? 4 : 2,
                                stroke: am5.color(isHighlighted ? 0xff00a8 : 0xffffff),
                            });
                        }
                    }
                }
            }
        });
    }, [highlightEndpoints]);

    useLayoutEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        rootRef.current = root;

        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5map.MapChart.new(root, {
                panX: 'rotateX',
                panY: 'rotateY',
                projection: am5map.geoOrthographic(),
                paddingBottom: 20,
                paddingTop: 20,
                paddingLeft: 20,
                paddingRight: 20,
            })
        );

        const polygonSeries = chart.series.push(
            am5map.MapPolygonSeries.new(root, {
                geoJSON: am5geodata_worldLow,
            })
        );

        polygonSeries.mapPolygons.template.setAll({
            tooltipText: '{name}',
            toggleKey: 'active',
            interactive: true,
            fill: am5.color(isDark ? 0x2d3748 : 0xe2e8f0),
            stroke: am5.color(isDark ? 0x1a202c : 0xffffff),
            strokeWidth: 0.5,
        });

        polygonSeries.mapPolygons.template.events.on('click', (ev) => {
            const geo = (ev.target.dataItem?.dataContext as any)?.geometry;
            if (geo && geo.type === "Polygon" && geo.coordinates?.[0]?.[0]) {
                const coords = geo.coordinates[0];
                let lat = 0, lon = 0;
                coords.forEach(([lng, lt]: [number, number]) => {
                    lat += lt;
                    lon += lng;
                });
                lat /= coords.length;
                lon /= coords.length;
                chart.zoomToGeoPoint({ latitude: lat, longitude: lon }, 2, true, 1000);
            }
        });

        const polygonTemplate = polygonSeries.mapPolygons.template;
        polygonTemplate.states.create('hover', {
            fill: am5.color(isDark ? 0x4a5568 : 0xcbd5e0),
        });

        const graticuleSeries = chart.series.unshift(
            am5map.GraticuleSeries.new(root, {
                step: 10,
            })
        );

        graticuleSeries.mapLines.template.setAll({
            stroke: am5.color(isDark ? 0x4a5568 : 0xcbd5e0),
            strokeOpacity: 0.3,
        });

        const backgroundSeries = chart.series.unshift(
            am5map.MapPolygonSeries.new(root, {})
        );

        backgroundSeries.mapPolygons.template.setAll({
            fill: am5.color(isDark ? 0x0a0e1a : 0xf8fafc),
            fillOpacity: 1,
            strokeOpacity: 0,
        });

        backgroundSeries.data.push({
            geometry: am5map.getGeoRectangle(90, 180, -90, -180),
        });

        const pointSeries = chart.series.push(
            am5map.MapPointSeries.new(root, {
                latitudeField: 'latitude',
                longitudeField: 'longitude',
            })
        );

        pointSeriesRef.current = pointSeries;

        pointSeries.bullets.push((root, series, dataItem) => {
            const container = am5.Container.new(root, {});

            const data = dataItem.dataContext as any;
            const isHighlighted = data.nodes?.some((l: LeafMeta) =>
                highlightEndpoints.includes(l.address.endpoint)
            ) || false;

            const circle = container.children.push(
                am5.Circle.new(root, {
                    radius: 6,
                    tooltipY: 0,
                    fill: am5.color(isHighlighted ? 0xff00a8 : 0x9945ff),
                    strokeWidth: isHighlighted ? 4 : 2,
                    stroke: am5.color(isHighlighted ? 0xff00a8 : 0xffffff),
                    tooltipText: '{title}\n{info}',
                    cursorOverStyle: 'pointer',
                })
            );

            circle.animate({
                key: 'scale',
                from: 1,
                to: 1.3,
                duration: 1000,
                easing: am5.ease.yoyo(am5.ease.inOut(am5.ease.cubic)),
                loops: Infinity,
            });

            circle.events.on('pointerover', (e) => {
                const data = dataItem.dataContext as any;
                if (data && data.nodes && data.nodes.length > 0) {
                    onLeafHover(data.nodes[0]);
                }
                circle.set('fill', am5.color(data.color || 0x9945ff));
                circle.set('radius', 10);
            });

            circle.events.on('pointerout', () => {
                const data = dataItem.dataContext as any;
                const isHighlighted = data.nodes?.some((l: LeafMeta) =>
                    highlightEndpoints.includes(l.address.endpoint)
                ) || false;
                circle.set('fill', am5.color(isHighlighted ? 0xff00a8 : 0x9945ff));
                circle.set('radius', 6);
            });

            circle.events.on('click', (e) => {
                const data = dataItem.dataContext as any;
                if (data && data.nodes && data.nodes.length > 0) {
                    onLeafHover(data.nodes[0]);
                    chart.zoomToGeoPoint(
                        { latitude: data.latitude, longitude: data.longitude },
                        3,
                        true,
                        800
                    );
                }
            });

            return am5.Bullet.new(root, {
                sprite: container,
            });
        });

        const sortedData = [...baseMapData].sort((a, b) => {
            const aHighlighted = a.nodes?.some((l: LeafMeta) =>
                highlightEndpoints.includes(l.address.endpoint)
            );
            const bHighlighted = b.nodes?.some((l: LeafMeta) =>
                highlightEndpoints.includes(l.address.endpoint)
            );
            return (aHighlighted ? 1 : 0) - (bHighlighted ? 1 : 0);
        });

        pointSeries.data.setAll(sortedData);

        chart.animate({
            key: 'rotationX',
            from: 0,
            to: 360,
            duration: 120000,
            loops: Infinity,
        });

        chart.set('rotationX', -20);
        chart.set('rotationY', -20);

        chart.appear(1000, 100);

        return () => {
            root.dispose();
        };
    }, [allLeaves, isDark, onLeafHover, baseMapData]);

    useLayoutEffect(() => {
        if (!rootRef.current) return;

        const root = rootRef.current;
        const chart = root.container.children.getIndex(0) as am5map.MapChart;
        if (!chart) return;

        let polygonSeries: am5map.MapPolygonSeries | undefined;
        let backgroundSeries: am5map.MapPolygonSeries | undefined;
        let graticuleSeries: am5map.GraticuleSeries | undefined;

        chart.series.each(series => {
            if (series instanceof am5map.MapPolygonSeries && !polygonSeries && series.get("geoJSON")) {
                polygonSeries = series;
            } else if (series instanceof am5map.MapPolygonSeries && !backgroundSeries && !series.get("geoJSON")) {
                backgroundSeries = series;
            } else if (series instanceof am5map.GraticuleSeries) {
                graticuleSeries = series;
            }
        });

        if (polygonSeries) {
            polygonSeries.mapPolygons.template.setAll({
                fill: am5.color(isDark ? 0x2d3748 : 0xe2e8f0),
                stroke: am5.color(isDark ? 0x1a202c : 0xffffff),
            });
        }

        if (backgroundSeries) {
            backgroundSeries.mapPolygons.template.setAll({
                fill: am5.color(isDark ? 0x0a0e1a : 0xf8fafc),
            });
        }

        if (graticuleSeries) {
            graticuleSeries.mapLines.template.setAll({
                stroke: am5.color(isDark ? 0x4a5568 : 0xcbd5e0),
            });
        }
    }, [isDark]);

    const bgClass = isDark
        ? 'bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#1a0f2e]'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100';

    return (
        <div className={`flex-grow relative ${bgClass} ${isVisible ? 'block' : 'hidden'}`}>
            <div ref={chartRef} style={{ width: '100%', height: '100%' }} />

            <div className={`absolute top-[20rem] left-8 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-xl rounded-xl p-4 shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Node Distribution
                </h3>
                <div className="space-y-2">
                    {validators.slice(0, 5).map((validator) => {
                        const count = allLeaves.filter((leaf) => {
                            if (leaf.version === validator.version) return true;
                            const majorMinor = String(leaf.version).match(/^(\d+\.\d+)/)?.[1];
                            if (majorMinor === validator.version) return true;
                            if (String(leaf.version).startsWith(validator.version)) return true;
                            return false;
                        }).length;

                        return (
                            <div key={validator.version} className="flex items-center gap-2 text-xs">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: validator.color }}
                                />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                    {validator.name}
                                </span>
                                <span className={`ml-auto font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={`absolute top-8 left-8 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-xl rounded-xl p-4 shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="space-y-3">
                    <div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                            Total Nodes
                        </div>
                        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {allLeaves.length}
                        </div>
                    </div>
                    <div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                            Online Nodes
                        </div>
                        <div className="text-2xl font-bold text-green-500">
                            {allLeaves.filter((l) => l.is_online).length}
                        </div>
                    </div>
                    <div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                            Accessible Nodes
                        </div>
                        <div className="text-2xl font-bold text-cyan-500">
                            {allLeaves.filter((l) => l.is_accessible).length}
                        </div>
                    </div>
                    <div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                            Countries
                        </div>
                        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {new Set(allLeaves.map((l) => l.address.ip_info?.countryCode).filter(Boolean)).size}
                        </div>
                    </div>
                </div>
            </div>

            {isDark && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl"></div>
                </div>
            )}
        </div>
    );
};