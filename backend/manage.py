#!/usr/bin/env python
import os
import sys
from pathlib import Path

def auto_activate_venv():
    # If already running inside a virtual environment, do nothing
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        return
    base_dir = Path(__file__).resolve().parent
    venv_dir = base_dir / 'venv'
    if not venv_dir.exists():
        return
    venv_python = venv_dir / ('Scripts' if os.name == 'nt' else 'bin') / ('python.exe' if os.name == 'nt' else 'python')
    if venv_python.exists() and os.path.abspath(sys.executable) != os.path.abspath(str(venv_python)):
        os.execv(str(venv_python), [str(venv_python)] + sys.argv)

def main():
    auto_activate_venv()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
