import Sidebar from "@components/Sidebar";
import LayoutShell from "@components/LayoutShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <LayoutShell>{children}</LayoutShell>
    </>
  );
}
