import React from 'react';
import { BeamConfig, LoadType, SupportType } from '../types';

interface Props {
    config: BeamConfig;
    isDarkMode?: boolean;
}

const BeamVisualizer: React.FC<Props> = ({ config, isDarkMode = false }) => {
    const width = 800;
    const height = 250; // Increased height for dimensions
    const paddingX = 40;
    const beamY = 120; // Lowered beam to make room for arrows above
    const drawWidth = width - paddingX * 2;

    // Scale factor
    const scaleX = (x: number) => paddingX + (x / config.length) * drawWidth;

    // Collect key points for dimension lines
    const keyPoints = new Set<number>();
    keyPoints.add(0);
    keyPoints.add(config.length);
    config.supports.forEach(s => keyPoints.add(s.position));
    config.loads.forEach(l => {
        keyPoints.add(l.position);
        if (l.length) keyPoints.add(l.position + l.length);
    });
    const sortedPoints = Array.from(keyPoints).sort((a, b) => a - b);

    // Styling Constants based on Theme
    const colors = {
        bg: isDarkMode ? '#1e293b' : '#ffffff',
        text: isDarkMode ? '#cbd5e1' : '#475569',
        textDim: isDarkMode ? '#94a3b8' : '#64748b',
        beamFill: isDarkMode ? '#334155' : '#e2e8f0',
        beamStroke: isDarkMode ? '#94a3b8' : '#475569',
        supportFill: isDarkMode ? '#475569' : '#cbd5e1',
        supportStroke: isDarkMode ? '#94a3b8' : '#475569',
        load: '#ef4444',
        dimLine: isDarkMode ? '#64748b' : '#cbd5e1',
        dimTextBg: isDarkMode ? '#1e293b' : '#ffffff',
        dimText: isDarkMode ? '#e2e8f0' : '#475569'
    };

    return (
        <div className="w-full overflow-x-auto flex flex-col items-center">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <defs>
                    <marker id="arrowheadDown" markerWidth="10" markerHeight="7" refX="5" refY="7" orient="auto">
                        <polygon points="0 0, 10 0, 5 7" fill={colors.load} />
                    </marker>
                    <marker id="arrowheadUp" markerWidth="10" markerHeight="7" refX="5" refY="0" orient="auto">
                        <polygon points="0 7, 10 7, 5 0" fill={colors.supportStroke} />
                    </marker>
                    <marker id="dimArrowStart" markerWidth="8" markerHeight="8" refX="0" refY="4" orient="auto">
                        <path d="M8,0 L0,4 L8,8" fill="none" stroke={colors.textDim} />
                    </marker>
                    <marker id="dimArrowEnd" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                        <path d="M0,0 L8,4 L0,8" fill="none" stroke={colors.textDim} />
                    </marker>
                    <pattern id="diagonalHatch" width="4" height="4" patternUnits="userSpaceOnUse">
                        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke={colors.load} strokeWidth="1" />
                    </pattern>
                </defs>

                {/* Dimension Lines (Bottom) */}
                {sortedPoints.map((pt, i) => {
                    if (i === sortedPoints.length - 1) return null;
                    const nextPt = sortedPoints[i + 1];
                    const x1 = scaleX(pt);
                    const x2 = scaleX(nextPt);
                    const dimY = beamY + 50;

                    return (
                        <g key={`dim-${i}`}>
                            {/* Vertical extension lines */}
                            <line x1={x1} y1={beamY + 10} x2={x1} y2={dimY + 5} stroke={colors.dimLine} strokeDasharray="2 2" />
                            <line x1={x2} y1={beamY + 10} x2={x2} y2={dimY + 5} stroke={colors.dimLine} strokeDasharray="2 2" />
                            {/* Horizontal dimension line */}
                            <line x1={x1} y1={dimY} x2={x2} y2={dimY} stroke={colors.textDim} markerStart="url(#dimArrowStart)" markerEnd="url(#dimArrowEnd)" />
                            {/* Text Label */}
                            <rect x={(x1 + x2) / 2 - 15} y={dimY - 8} width="30" height="16" fill={colors.dimTextBg} />
                            <text x={(x1 + x2) / 2} y={dimY + 4} textAnchor="middle" fill={colors.dimText} className="text-[10px] font-bold">
                                {(nextPt - pt).toFixed(2)}
                            </text>
                        </g>
                    )
                })}

                {/* Main Beam */}
                <rect
                    x={scaleX(0)}
                    y={beamY - 5}
                    width={drawWidth}
                    height={10}
                    fill={colors.beamFill}
                    stroke={colors.beamStroke}
                    strokeWidth="2"
                />

                {/* Supports */}
                {config.supports.map((s) => (
                    <g key={s.id} transform={`translate(${scaleX(s.position)}, ${beamY + 5})`}>
                        {s.type === SupportType.FIXED ? (
                            <g>
                                <line x1="-5" y1="-20" x2="-5" y2="20" stroke={colors.supportStroke} strokeWidth="3" />
                                {/* Hatching for fixed wall */}
                                {[...Array(6)].map((_, i) => (
                                    <line key={i} x1="-5" y1={-20 + i * 7} x2="-12" y2={-15 + i * 7} stroke={colors.supportStroke} />
                                ))}
                            </g>
                        ) : s.type === SupportType.PIN ? (
                            <path d="M0,0 L-8,15 L8,15 Z" fill={colors.supportFill} stroke={colors.supportStroke} strokeWidth="2" />
                        ) : (
                            <g>
                                <path d="M0,0 L-8,12 L8,12 Z" fill={colors.supportFill} stroke={colors.supportStroke} strokeWidth="2" />
                                <line x1="-10" y1="15" x2="10" y2="15" stroke={colors.supportStroke} strokeWidth="2" />
                                <circle cx="-5" cy="15" r="2" fill="none" stroke={colors.supportStroke} />
                                <circle cx="5" cy="15" r="2" fill="none" stroke={colors.supportStroke} />
                            </g>
                        )}
                        <text y={35} textAnchor="middle" fontSize="10" fill={colors.text} className="font-bold">{s.id.toUpperCase()}</text>
                    </g>
                ))}

                {/* Loads */}
                {config.loads.map((l) => {
                    const xStart = scaleX(l.position);

                    if (l.type === LoadType.POINT) {
                        return (
                            <g key={l.id} transform={`translate(${xStart}, ${beamY - 5})`}>
                                {/* Point Load: Arrow pointing DOWN onto the beam */}
                                <line x1="0" y1="-60" x2="0" y2="0" stroke={colors.load} strokeWidth="3" markerEnd="url(#arrowheadDown)" />
                                <text x="5" y="-65" textAnchor="middle" fill={colors.load} className="font-bold text-xs">{l.magnitude}{config.unitForce}</text>
                            </g>
                        );
                    }

                    if (l.length) {
                        const widthPx = (l.length / config.length) * drawWidth;

                        if (l.type === LoadType.DISTRIBUTED) {
                            return (
                                <g key={l.id} transform={`translate(${xStart}, ${beamY - 5})`}>
                                    <rect x="0" y="-30" width={widthPx} height="30" fill="url(#diagonalHatch)" stroke="none" opacity="0.3" />
                                    <line x1="0" y1="-30" x2={widthPx} y2="-30" stroke={colors.load} strokeWidth="2" />

                                    {/* Multiple arrows for distributed */}
                                    {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                                        <line key={i} x1={widthPx * f} y1="-30" x2={widthPx * f} y2="0" stroke={colors.load} strokeWidth="1" markerEnd="url(#arrowheadDown)" />
                                    ))}

                                    <text x={widthPx / 2} y="-40" textAnchor="middle" fill={colors.load} className="font-bold text-xs">q = {l.magnitude}{config.unitForce}/{config.unitLength}</text>
                                </g>
                            );
                        }

                        if (l.type === LoadType.TRIANGULAR) {
                            // Draw Triangle: (0,0) -> (width, -height) -> (width, 0)
                            // SVG coords: y=0 is beam top. y negative is up.
                            const hPx = 40; // visual height
                            return (
                                <g key={l.id} transform={`translate(${xStart}, ${beamY - 5})`}>
                                    <polygon points={`0,0 ${widthPx},-${hPx} ${widthPx},0`} fill="url(#diagonalHatch)" opacity="0.3" />
                                    <line x1="0" y1="0" x2={widthPx} y2={`-${hPx}`} stroke={colors.load} strokeWidth="2" />

                                    {/* Arrows increasing in size */}
                                    {[0.2, 0.4, 0.6, 0.8, 1].map((f, i) => (
                                        <line key={i} x1={widthPx * f} y1={`-${hPx * f}`} x2={widthPx * f} y2="0" stroke={colors.load} strokeWidth="1" markerEnd="url(#arrowheadDown)" />
                                    ))}

                                    <text x={widthPx} y={`-${hPx + 10}`} textAnchor="middle" fill={colors.load} className="font-bold text-xs">q_max = {l.magnitude}</text>
                                </g>
                            )
                        }
                    }
                    return null;
                })}
            </svg>
        </div>
    );
};

export default BeamVisualizer;
