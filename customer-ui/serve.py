#!/usr/bin/env python3
"""
Simple HTTP server to serve the customer UI
Alternative to Node.js server for environments without Node.js
"""

import http.server
import socketserver
import os
import sys

def run_server(port=3000):
    """Run a simple HTTP server to serve the customer UI"""
    
    # Change to the customer-ui directory
    customer_ui_dir = os.path.join(os.path.dirname(__file__))
    os.chdir(customer_ui_dir)
    
    # Create server
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), Handler) as httpd:
            print(f"Customer UI server running at http://localhost:{port}")
            print("Make sure your FastAPI backend is running on http://localhost:8000")
            print("Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Port already in use
            print(f"Port {port} is already in use. Try a different port.")
            sys.exit(1)
        else:
            raise

if __name__ == "__main__":
    port = 3000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Invalid port number. Using default port 3000.")
    
    run_server(port)
