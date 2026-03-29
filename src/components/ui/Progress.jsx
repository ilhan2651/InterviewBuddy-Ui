// src/components/ui/Progress.jsx
import React from 'react';

const Progress = ({
    value = 0,
    max = 100,
    label,
    showPercentage = true,
    color = 'primary',
    className = ''
}) => {
    const percentage = Math.round((value / max) * 100);

    const colors = {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        success: 'bg-green-500',
        warning: 'bg-orange-500',
        danger: 'bg-red-500'
    };

    return (
        <div className={`w-full ${className}`}>
            {(label || showPercentage) && (
                <div className="flex justify-between items-center mb-2">
                    {label && <span className="text-sm font-semibold text-text-main">{label}</span>}
                    {showPercentage && <span className="text-sm font-bold text-text-main">{percentage}%</span>}
                </div>
            )}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div
                    className={`h-full ${colors[color]} transition-all duration-500 ease-out rounded-full relative`}
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

export default Progress;
