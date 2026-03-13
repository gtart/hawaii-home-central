# Claude Subagent Activity Logs

Automated logs of Claude Code subagent usage for this project.

## Log File

`subagents.jsonl` — one JSON object per line, appended by Claude hooks on SubagentStart and SubagentStop events.

## Log Format

```json
{"timestamp":"2026-03-12T10:30:00Z","event":"subagent_start","agent_type":"Explore","agent_id":"abc123","session_id":"def456"}
{"timestamp":"2026-03-12T10:30:15Z","event":"subagent_stop","agent_type":"Explore","agent_id":"abc123","session_id":"def456"}
```

## Fields

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 UTC timestamp |
| `event` | `subagent_start` or `subagent_stop` |
| `agent_type` | Agent type (e.g. `Explore`, `Plan`, `general-purpose`) |
| `agent_id` | Unique agent instance ID |
| `session_id` | Claude session that spawned the agent |

## How It Works

Claude Code hooks in `.claude/settings.json` trigger shell scripts on `SubagentStart` and `SubagentStop` events. The scripts read JSON from stdin and append a log line to this file.

Hook scripts: `.claude/hooks/log-subagent-start.sh` and `.claude/hooks/log-subagent-stop.sh`

## Inspecting Logs

```bash
# All subagent activity
cat docs/ai/agent-logs/subagents.jsonl

# Count by agent type
cat docs/ai/agent-logs/subagents.jsonl | jq -r '.agent_type' | sort | uniq -c | sort -rn

# Today's activity
grep "$(date -u +%Y-%m-%d)" docs/ai/agent-logs/subagents.jsonl | jq .

# Starts without stops (possibly still running)
comm -23 \
  <(jq -r 'select(.event=="subagent_start") | .agent_id' docs/ai/agent-logs/subagents.jsonl | sort) \
  <(jq -r 'select(.event=="subagent_stop") | .agent_id' docs/ai/agent-logs/subagents.jsonl | sort)
```

## Maintenance

This file grows over time. Periodically archive old entries:
```bash
mv docs/ai/agent-logs/subagents.jsonl docs/ai/agent-logs/subagents-$(date +%Y-%m).jsonl
touch docs/ai/agent-logs/subagents.jsonl
```
