#!/bin/bash
# Convenience wrapper: manually log a subagent start event
# Usage: ./scripts/log-subagent-start.sh <agent_type> <agent_id> [session_id]
set -e

AGENT_TYPE="${1:-unknown}"
AGENT_ID="${2:-unknown}"
SESSION_ID="${3:-manual}"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$REPO_ROOT/docs/ai/agent-logs/subagents.jsonl"

mkdir -p "$(dirname "$LOG_FILE")"
echo "{\"timestamp\":\"$TIMESTAMP\",\"event\":\"subagent_start\",\"agent_type\":\"$AGENT_TYPE\",\"agent_id\":\"$AGENT_ID\",\"session_id\":\"$SESSION_ID\"}" >> "$LOG_FILE"

echo "Logged subagent_start: type=$AGENT_TYPE id=$AGENT_ID"
