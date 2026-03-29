// src/components/ui/Card.jsx
import React from 'react';

const Card = ({
    children,
    className = '',
    glass = false,
    hover = false,
    ...props
}) => {
    const glassStyles = glass
        ? "glass"
        : "bg-surface border border-slate-200 shadow-sm";

    const hoverStyles = hover ? "hover:shadow-xl hover:-translate-y-1 transition-all duration-300" : "";

    return (
        <div
            className={`rounded-3xl p-6 ${glassStyles} ${hoverStyles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
