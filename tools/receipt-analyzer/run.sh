#!/bin/bash
# 領収書解析ツール ランチャー
# 使い方: ./run.sh /path/to/receipts/2026
#         ./run.sh /path/to/receipts/2026 --model sonnet
#         ./run.sh /path/to/receipts/2026 --dry-run

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
node src/index.js "$@"
