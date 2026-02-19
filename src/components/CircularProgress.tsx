import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface Props {
    /** 0–1 fill ratio */
    progress: number;
    size: number;
    strokeWidth: number;
    color: string;
    trackColor?: string;
}

/**
 * Circular progress ring using react-native-svg.
 * The arc starts at the 12 o'clock position and fills clockwise.
 */
export function CircularProgress({
    progress,
    size,
    strokeWidth,
    color,
    trackColor = '#e5e7eb',
}: Props) {
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    // dashOffset = 0 means full ring; circumference means empty
    const dashOffset = circumference * (1 - clampedProgress);

    return (
        // Rotate -90° so arc starts at top (12 o'clock)
        <Svg
            width={size}
            height={size}
            style={{ transform: [{ rotate: '-90deg' }] }}
        >
            {/* Track */}
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="none"
            />
            {/* Fill */}
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
            />
        </Svg>
    );
}
