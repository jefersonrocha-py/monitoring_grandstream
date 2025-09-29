// app/(auth)/layout.tsx
export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <section className="min-h-screen">{children}</section>;
}
