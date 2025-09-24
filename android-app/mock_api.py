#!/usr/bin/env python3

import json
from http.server import HTTPServer, BaseHTTPRequestHandler


class MockHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200, content_type="application/json"):
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.end_headers()

    def log_message(self, format, *args):
        # Reduce noisy logging
        return

    def do_GET(self):
        if self.path == "/api/health":
            self._set_headers(200, "text/plain; charset=utf-8")
            self.wfile.write(b"ok")
            return
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "not_found"}).encode("utf-8"))

    def do_POST(self):
        if self.path == "/api/auth/login":
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
            try:
                data = json.loads(raw_body.decode("utf-8"))
            except Exception:
                data = {}
            if data.get("email") and data.get("password"):
                response = {
                    "token": "dev-token",
                    "user": {
                        "email": data.get("email"),
                        "role": data.get("role", "patient"),
                    },
                }
                self._set_headers(200)
                self.wfile.write(json.dumps(response).encode("utf-8"))
                return
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "invalid"}).encode("utf-8"))
            return
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "not_found"}).encode("utf-8"))


def run_server(host: str = "127.0.0.1", port: int = 5000):
    server_address = (host, port)
    httpd = HTTPServer(server_address, MockHandler)
    print(f"Mock API listening on http://{host}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    run_server()


