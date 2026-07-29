#!/usr/bin/env python
"""
Management script for Ordinary Tools FastAPI Backend.
Allows starting the server using standard command syntax such as:
    py manage.py runserver [host:port or port]
Automatically uses virtual environment python if detected.
"""

import sys
import os
import subprocess

def auto_activate_venv():
    # If uvicorn is not in the current python environment, check for .venv/venv
    try:
        import uvicorn
        return
    except ImportError:
        pass

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    possible_venvs = [
        os.path.join(backend_dir, ".venv", "Scripts", "python.exe"),
        os.path.join(backend_dir, "venv", "Scripts", "python.exe"),
        os.path.join(backend_dir, "env", "Scripts", "python.exe"),
        os.path.join(backend_dir, ".venv", "bin", "python"),
        os.path.join(backend_dir, "venv", "bin", "python"),
    ]

    for venv_python in possible_venvs:
        if os.path.exists(venv_python) and os.path.abspath(venv_python) != os.path.abspath(sys.executable):
            cmd = [venv_python, os.path.abspath(__file__)] + sys.argv[1:]
            sys.exit(subprocess.call(cmd))

def main():
    auto_activate_venv()

    args = sys.argv[1:]
    
    # Default behavior or 'runserver' command
    if not args or args[0] == "runserver":
        host = os.getenv("HOST", "127.0.0.1")
        port = int(os.getenv("PORT", 8000))
        reload = True

        # Parse additional arguments if provided, e.g. manage.py runserver 8000 or manage.py runserver 0.0.0.0:8000
        server_args = args[1:] if len(args) > 1 else []
        for arg in server_args:
            if arg.isdigit():
                port = int(arg)
            elif ":" in arg:
                parts = arg.split(":")
                if parts[0]:
                    host = parts[0]
                if parts[1].isdigit():
                    port = int(parts[1])
            elif arg == "--noreload":
                reload = False

        print(f"Starting Ordinary Tools Backend at http://{host}:{port} (reload={reload})...")
        
        try:
            import uvicorn
        except ImportError:
            print("Error: uvicorn is not installed in the active environment or virtualenv.")
            print("Please run: pip install -r requirements.txt")
            sys.exit(1)

        uvicorn.run("main:app", host=host, port=port, reload=reload)
    elif args[0] in ["-h", "--help", "help"]:
        print("Usage: py manage.py runserver [port or host:port] [--noreload]")
    else:
        print(f"Unknown command: '{args[0]}'. Available commands: runserver")
        sys.exit(1)

if __name__ == "__main__":
    main()
