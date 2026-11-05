"""Servidor local para el prototipo (sin caché, multihilo)."""
import http.server, os, functools

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))
port = int(os.environ.get("PORT", 8080))
print(f"Sirviendo prototipos en http://0.0.0.0:{port}", flush=True)
http.server.ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()
