import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export function AbsenceLineChart() {
    const data = {
        labels: ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'],
        datasets: [
            {
                label: 'Absences élèves',
                data: [28, 42, 35, 55, 44, 38],
                borderColor: '#0E9E8E',
                backgroundColor: 'rgba(14,158,142,.08)',
                borderWidth: 2.5,
                tension: 0.42,
                fill: true,
                pointBackgroundColor: '#0E9E8E',
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Absences enseignants',
                data: [4, 7, 5, 9, 6, 5],
                borderColor: '#E8A020',
                backgroundColor: 'rgba(232,160,32,.07)',
                borderWidth: 2.5,
                tension: 0.42,
                fill: true,
                pointBackgroundColor: '#E8A020',
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: { family: 'DM Sans', size: 12 },
                    color: '#6B7E9F',
                    usePointStyle: true,
                    pointStyleWidth: 8,
                    boxHeight: 8
                }
            },
            tooltip: {
                backgroundColor: '#1A2B4A',
                titleFont: { family: 'DM Sans' },
                bodyFont: { family: 'DM Sans' },
                cornerRadius: 10
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: 'DM Sans', size: 12 }, color: '#6B7E9F' },
                border: { display: false }
            },
            y: {
                grid: { color: 'rgba(26,43,74,.06)' },
                ticks: { font: { family: 'DM Sans', size: 12 }, color: '#6B7E9F' },
                border: { display: false }
            },
        },
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-card h-full flex flex-col">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h3 className="font-display text-[16px] font-semibold text-navy">Évolution des absences</h3>
                    <p className="text-slate text-[12px] mt-0.5">Élèves & Enseignants — 6 derniers mois</p>
                </div>
                <div className="flex bg-ice rounded-lg p-0.5">
                    <button className="px-3 py-1.5 rounded-md text-[12px] font-semibold text-navy bg-white shadow-sm">Mois</button>
                    <button className="px-3 py-1.5 rounded-md text-[12px] text-slate">Semaine</button>
                </div>
            </div>
            <div className="flex-1 min-h-[250px]">
                <Line data={data} options={options} />
            </div>
        </div>
    );
}
