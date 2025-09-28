import { addClient } from "@lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { signal } = req;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const remove = addClient(controller);
      const encoder = new TextEncoder();

      // Heartbeat a cada 20s
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
        } catch {
          // Se der erro, encerra e limpa
          closed = true;
          clearInterval(heartbeat);
          remove();
          try { controller.close(); } catch {}
        }
      }, 20000);

      // Fechamento limpo quando o cliente desconectar/abortar
      const onAbort = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        remove();
        try { controller.close(); } catch {}
      };

      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    },
    cancel() {
      // chamado quando o consumidor cancela
      // (o onAbort acima já cobre, mas deixo por segurança)
      // nada extra necessário aqui
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
