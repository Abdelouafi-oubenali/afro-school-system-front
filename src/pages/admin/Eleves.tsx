import Layout from "../../components/layout/Layout";
import StatCard from "../../components/layout/StatCard";
import EleveList from "../../components/eleves/EleveList";

export default function Eleves() {
  return (
    <Layout>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-[22px] text-navy leading-tight">Gestion des élèves</h2>
          <p className="text-slate text-[13px] mt-0.5">Administration des fiches élèves, contacts et suivi</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="bg-white border border-navy/10 text-navy text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-ice transition-colors">
            Importer CSV
          </button>
          <button className="bg-white border border-navy/10 text-navy text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-ice transition-colors">
            Exporter liste
          </button>
          <button className="nav-active text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-teal hover:opacity-95 transition-opacity">
            + Nouvel élève
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <StatCard
          title="Total élèves"
          value="847"
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          )}
          trendValue="+24 ce mois"
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
          title="Comptes actifs"
          value="812"
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          )}
          trendValue="96%"
          trendIcon={(
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
          )}
          colorTheme={{
            gradient: "linear-gradient(90deg,#E8A020,#F5B84C)",
            iconBg: "rgba(232,160,32,.1)", iconColor: "#E8A020",
            trendBg: "rgba(232,160,32,.15)", trendColor: "#E8A020"
          }}
          delay="0.1s"
        />
        <StatCard
          title="Sans email"
          value="35"
          icon={(
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 12a10 10 0 11-10-10" /><line x1="22" y1="2" x2="12" y2="12" />
            </svg>
          )}
          trendValue="A corriger"
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
      </div>

      <EleveList />
    </Layout>
  );
}
