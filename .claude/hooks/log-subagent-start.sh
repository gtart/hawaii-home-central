#!/bin/bash
# Claude hook: SubagentStart — logs subagent spawn to docs/ai/agent-logs/subagents.jsonl
# Receives JSON on stdin with: agent_id, agent_type, session_id, cwd, hook_event_name
set -e

INPUT=$(cat)
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Parse JSON — use jq if available, otherwise grep/sed fallback
if command -v jq &>/dev/null; then
  AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // "unknown"')
  AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // "unknown"')
  SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
else
  AGENT_TYPE=$(echo "$INPUT" | grep -oP '"agent_type"\s*:\s*"\K[^"]*' || echo "unknown")
  AGENT_ID=$(echo "$INPUT" | grep -oP '"agent_id"\s*:\s*"\K[^"]*' || echo "unknown")
  SESSION_ID=$(echo "$INPUT" | grep -oP '"session_id"\s*:\s*"\K[^"]*' || echo "unknown")
fi

# Resolve log file relative to repo root
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_FILE="$REPO_ROOT/docs/ai/agent-logs/subagents.jsonl"

# Ensure directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Append log entry
echo "{\"timestamp\":\"$TIMESTAMP\",\"event\":\"subagent_start\",\"agent_type\":\"$AGENT_TYPE\",\"agent_id\":\"$AGENT_ID\",\"session_id\":\"$SESSION_ID\"}" >> "$LOG_FILE"

exit 0
