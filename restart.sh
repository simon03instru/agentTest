#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-auto}" # auto | docker | local | backend-only | frontend-only
COMPOSE_FILE="${ROOT_DIR}/docker-compose.test.yml"
BACKEND_LOG="/tmp/agenttest-backend.log"
FRONTEND_LOG="/tmp/agenttest-frontend.log"

BACKEND_PORT="${BACKEND_PORT:-8009}"
FRONTEND_PORT="${FRONTEND_PORT:-3009}"

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*" >&2; }
err()  { echo "[ERROR] $*" >&2; }

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

wait_http() {
  local url="$1"
  local retries="${2:-25}"
  local sleep_s="${3:-1}"
  local i

  for i in $(seq 1 "$retries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$sleep_s"
  done
  return 1
}

kill_if_running() {
  local pattern="$1"
  if pgrep -f "$pattern" >/dev/null 2>&1; then
    info "Stopping process pattern: $pattern"
    pkill -f "$pattern" || true
    sleep 1
  fi
}

restart_docker() {
  if ! has_cmd docker; then
    err "docker is not installed. Use local mode: ./restart.sh local"
    exit 1
  fi

  info "Restarting services with Docker Compose..."
  cd "$ROOT_DIR"
  docker compose -f "$COMPOSE_FILE" down
  docker compose -f "$COMPOSE_FILE" up -d --build

  info "Docker services status:"
  docker compose -f "$COMPOSE_FILE" ps
  info "Done."
}

restart_local() {
  cd "$ROOT_DIR"

  if ! has_cmd python3; then
    err "python3 not found."
    exit 1
  fi

  if ! has_cmd npm; then
    err "npm not found. Install Node.js/npm or use docker mode."
    exit 1
  fi

  info "Stopping existing local backend/frontend (if any)..."
  kill_if_running "uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT}"
  kill_if_running "vite --host 0.0.0.0 --port ${FRONTEND_PORT}"
  kill_if_running "npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT}"

  info "Starting backend on :${BACKEND_PORT} ..."
  nohup python3 -m uvicorn main:app --host 0.0.0.0 --port "${BACKEND_PORT}" >"$BACKEND_LOG" 2>&1 &
  local backend_pid=$!
  info "Backend PID: ${backend_pid}"

  info "Starting frontend on :${FRONTEND_PORT} ..."
  cd "$ROOT_DIR/station-dashboard"
  nohup npm run dev -- --host 0.0.0.0 --port "${FRONTEND_PORT}" >"$FRONTEND_LOG" 2>&1 &
  local frontend_pid=$!
  info "Frontend PID: ${frontend_pid}"

  info "Running health checks..."
  if wait_http "http://127.0.0.1:${BACKEND_PORT}/" 30 1; then
    info "Backend is up: http://127.0.0.1:${BACKEND_PORT}/"
  else
    warn "Backend health check failed. Last backend log lines:"
    tail -n 50 "$BACKEND_LOG" || true
  fi

  if wait_http "http://127.0.0.1:${FRONTEND_PORT}/" 30 1; then
    info "Frontend is up: http://127.0.0.1:${FRONTEND_PORT}/"
  else
    warn "Frontend health check failed. Last frontend log lines:"
    tail -n 50 "$FRONTEND_LOG" || true
  fi

  info "Local restart complete."
  info "Logs:"
  info "  Backend : $BACKEND_LOG"
  info "  Frontend: $FRONTEND_LOG"
}

restart_backend_only() {
  cd "$ROOT_DIR"

  if ! has_cmd python3; then
    err "python3 not found."
    exit 1
  fi

  info "Stopping existing local backend (if any)..."
  kill_if_running "uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT}"

  info "Starting backend on :${BACKEND_PORT} ..."
  nohup python3 -m uvicorn main:app --host 0.0.0.0 --port "${BACKEND_PORT}" >"$BACKEND_LOG" 2>&1 &
  local backend_pid=$!
  info "Backend PID: ${backend_pid}"

  if wait_http "http://127.0.0.1:${BACKEND_PORT}/" 30 1; then
    info "Backend is up: http://127.0.0.1:${BACKEND_PORT}/"
  else
    warn "Backend health check failed. Last backend log lines:"
    tail -n 50 "$BACKEND_LOG" || true
    exit 1
  fi

  info "Backend-only restart complete."
  info "Backend log: $BACKEND_LOG"
}

restart_frontend_only() {
  cd "$ROOT_DIR/station-dashboard"

  if ! has_cmd npm; then
    err "npm not found. Install Node.js/npm or use docker mode."
    exit 1
  fi

  info "Stopping existing local frontend (if any)..."
  kill_if_running "vite --host 0.0.0.0 --port ${FRONTEND_PORT}"
  kill_if_running "npm run dev -- --host 0.0.0.0 --port ${FRONTEND_PORT}"

  info "Starting frontend on :${FRONTEND_PORT} ..."
  nohup npm run dev -- --host 0.0.0.0 --port "${FRONTEND_PORT}" >"$FRONTEND_LOG" 2>&1 &
  local frontend_pid=$!
  info "Frontend PID: ${frontend_pid}"

  if wait_http "http://127.0.0.1:${FRONTEND_PORT}/" 30 1; then
    info "Frontend is up: http://127.0.0.1:${FRONTEND_PORT}/"
  else
    warn "Frontend health check failed. Last frontend log lines:"
    tail -n 50 "$FRONTEND_LOG" || true
    exit 1
  fi

  info "Frontend-only restart complete."
  info "Frontend log: $FRONTEND_LOG"
}

detect_mode_and_run() {
  case "$MODE" in
    docker)
      restart_docker
      ;;
    local)
      restart_local
      ;;
    backend-only)
      restart_backend_only
      ;;
    frontend-only)
      restart_frontend_only
      ;;
    auto)
      if has_cmd docker; then
        restart_docker
      else
        info "Docker not found, falling back to local mode."
        restart_local
      fi
      ;;
    *)
      err "Unknown mode: $MODE"
      echo "Usage: ./restart.sh [auto|docker|local|backend-only|frontend-only]"
      exit 1
      ;;
  esac
}

detect_mode_and_run
