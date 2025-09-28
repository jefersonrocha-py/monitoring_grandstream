export function connectSSE(onEvent: (e: MessageEvent) => void) {
  const ev = new EventSource("/api/events");
  ev.onmessage = onEvent;
  ev.onerror = () => {
    // tenta reconectar automaticamente (EventSource já tenta)
  };
  return () => ev.close();
}
