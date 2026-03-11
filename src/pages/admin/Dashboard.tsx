import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { AlertsPanel } from "../../components/dashboard/AlertsPanel";
import { StudentAlertTable } from "../../components/dashboard/StudentAlertTable";
import { AbsenceLineChart } from "../../components/dashboard/AbsenceLineChart";
import { StudentLevelDoughnut } from "../../components/dashboard/StudentLevelDoughnut";
import EleveList from "../../components/eleves/EleveList";
import { useClasses } from "../../hooks/useClasses";

export default function Dashboard() {
  const { classes } = useClasses();

  return (
    <Layout>
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        <StatCard
          title="Élèves inscrits"
          value="847"
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          )}
          trendValue="3.2%"
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#0E9E8E,#16BCA8)",
            iconBg: "rgba(14,158,142,.1)", iconColor: "#0E9E8E",
            trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B"
          }}
          delay="0.05s"
        />
        <StatCard
          title="Enseignants actifs"
          value="54"
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          )}
          trendValue="+1"
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#E8A020,#F5B84C)",
            iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020",
            trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B"
          }}
          delay="0.1s"
        />
        <StatCard
          title="Absences aujourd'hui"
          value="38"
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
          trendValue="8%"
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#E05C5C,#f08080)",
            iconBg: "rgba(224,92,92,.1)", iconColor: "#E05C5C",
            trendBg: "rgba(224,92,92,.12)", trendColor: "#E05C5C"
          }}
          delay="0.15s"
        />
        <StatCard
          title="Classes actives"
          value={classes.length}
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 21h18" /><rect x="5" y="9" width="4" height="8" /><rect x="10" y="5" width="4" height="12" /><rect x="15" y="11" width="4" height="6" />
            </svg>
          )}
          trendValue="Classes configurees"
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#3A7BD5,#5BA7FF)",
            iconBg: "rgba(58,123,213,.1)", iconColor: "#3A7BD5",
            trendBg: "rgba(58,123,213,.15)", trendColor: "#3A7BD5"
          }}
          delay="0.18s"
        />
        <StatCard
          title="Paiements à jour"
          value={<>94<span className="text-xl font-medium">%</span></>}
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          )}
          trendValue="12%"
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#5BAD8B,#7fcca4)",
            iconBg: "rgba(91,173,139,.1)", iconColor: "#5BAD8B",
            trendBg: "rgba(91,173,139,.15)", trendColor: "#5BAD8B"
          }}
          delay="0.2s"
        />
      </div>

      {/* QUICK ACTIONS */}
      <QuickActions />

      {/* CHARTS ROW */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <AbsenceLineChart />
        <StudentLevelDoughnut />
      </div>

      {/* ELEVES SECTION */}
      <EleveList />

      {/* BOTTOM ROW */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <StudentAlertTable />
        <AlertsPanel />
      </div>

    </Layout>
  );
}
