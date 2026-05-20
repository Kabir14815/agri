#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
# python -m gunicorn works when gunicorn is not on PATH (common on Render)
exec python -m gunicorn your_application.wsgi -c gunicorn.conf.py
