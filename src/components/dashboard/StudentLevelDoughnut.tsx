import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

export function StudentLevelDoughnut() {
    const data = {
        labels: ['Bon', 'Moyen', 'Faible'],
        datasets: [{
            data: [62, 27, 11],
            backgroundColor: ['#5BAD8B', '#E8A020', '#E05C5C'],
            borderWidth: 0,
            hoverOffset: 5
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1A2B4A',
                titleFont: { family: 'DM Sans' },
                bodyFont: { family: 'DM Sans' },
                cornerRadius: 10
            },
        },
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-card h-full flex flex-col">
            <h3 className="font-display text-[16px] font-semibold text-navy mb-0.5">Niveaux Étudiants</h3>
            <p className="text-slate text-[12px] mb-5">Répartition des 847 élèves</p>

            <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0" style={{ width: '128px', height: '128px' }}>
                    <Doughnut data={data} options={options} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-display text-[22px] font-bold text-navy leading-none">847</span>
                        <span className="text-[10px] text-slate">élèves</span>
                    </div>
                </div>

                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-sage flex-shrink-0"></span>
                        <span className="text-navy">Bon</span>
                        <span className="ml-auto font-semibold text-sage">62%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-gold flex-shrink-0"></span>
                        <span className="text-navy">Moyen</span>
                        <span className="ml-auto font-semibold text-gold">27%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]">
                        <span className="w-2.5 h-2.5 rounded-full bg-coral flex-shrink-0"></span>
                        <span className="text-navy">Faible</span>
                        <span className="ml-auto font-semibold text-coral">11%</span>
                    </div>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                <div>
                    <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-navy font-medium">Paiements collectés</span>
                        <span className="text-teal font-semibold">68 420 MAD</span>
                    </div>
                    <div className="h-2 bg-ice rounded-full overflow-hidden">
                        <div className="h-full bar-teal rounded-full" style={{ width: '79%' }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-navy font-medium">Impayés en attente</span>
                        <span className="text-coral font-semibold">4 380 MAD</span>
                    </div>
                    <div className="h-2 bg-ice rounded-full overflow-hidden">
                        <div className="h-full bar-coral rounded-full" style={{ width: '18%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
