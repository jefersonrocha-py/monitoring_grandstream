export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-40 glass animate-pulse rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="h-24 glass animate-pulse rounded-2xl" />
        <div className="h-24 glass animate-pulse rounded-2xl" />
        <div className="h-24 glass animate-pulse rounded-2xl" />
        <div className="h-24 glass animate-pulse rounded-2xl" />
      </div>
      <div className="h-72 glass animate-pulse rounded-2xl" />
      <div className="h-64 glass animate-pulse rounded-2xl" />
    </div>
  );
}
