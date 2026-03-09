import React from "react";

interface StatCardProps {
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    trendValue: string;
    trendIcon: React.ReactNode;
    colorTheme: {
        gradient: string;
        iconBg: string;
        iconColor: string;
        trendBg: string;
        trendColor: string;
    };
    delay?: string;
}

export default function StatCard({
    title,
    value,
    icon,
    trendValue,
    trendIcon,
    colorTheme,
    delay = "0s",
}: StatCardProps) {
    return (
        <div
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-200 relative overflow-hidden animate-fadeUp"
            style={{ animationDelay: delay }}
        >
            <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ background: colorTheme.gradient }}
            ></div>
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: colorTheme.iconBg, color: colorTheme.iconColor }}
                >
                    {icon}
                </div>
                <span
                    className="text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
                    style={{ background: colorTheme.trendBg, color: colorTheme.trendColor }}
                >
                    {trendIcon}
                    {trendValue}
                </span>
            </div>
            <div className="font-display text-[38px] font-bold text-navy leading-none mb-1">
                {value}
            </div>
            <div className="text-slate text-[13px]">{title}</div>
        </div>
    );
}
