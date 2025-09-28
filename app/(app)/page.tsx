import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("@components/MapClient"), { ssr: false });

export default function Page() {
  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10">
      <MapClient />
    </div>
  );
}
