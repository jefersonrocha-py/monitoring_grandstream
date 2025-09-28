type Props = { total: number; up: number; down: number; upPct: number; downPct: number };

export default function DashboardCards({ total, up, down, upPct, downPct }: Props) {
  const Card = ({
    title,
    value,
    sub,
    accent
  }: {
    title: string;
    value: string;
    sub?: string;
    accent?: "green" | "red" | "cyan";
  }) => {
    const ring =
      accent === "green"
        ? "ring-1 ring-emerald-400/50"
        : accent === "red"
        ? "ring-1 ring-rose-400/50"
        : "ring-1 ring-cyan-400/50";
    return (
      <div className={`glass rounded-2xl p-4 ${ring}`}>
        <div className="text-xs opacity-70">{title}</div>
        <div className="text-3xl font-semibold tracking-tight mt-1">{value}</div>
        {sub && <div className="text-xs opacity-60 mt-1">{sub}</div>}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card title="Total" value={String(total)} accent="cyan" />
      <Card title="UP" value={String(up)} sub={`${upPct.toFixed(1)}%`} accent="green" />
      <Card title="DOWN" value={String(down)} sub={`${downPct.toFixed(1)}%`} accent="red" />
      <Card title="Disponibilidade" value={`${upPct.toFixed(1)}%`} sub="(UP / Total)" accent="green" />
    </div>
  );
}
