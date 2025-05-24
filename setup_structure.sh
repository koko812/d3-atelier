#!/bin/bash

# 安全のための中断条件
set -e

echo "📦 新しいディレクトリ構造をセットアップ中..."

# 古い main.js / index.html を退避
mkdir -p legacy
[ -f main.js ] && mv main.js legacy/
[ -f index.html ] && mv index.html legacy/

# 新しい構造を作成
mkdir -p public
mkdir -p src/shapes
mkdir -p src/params
mkdir -p style
mkdir -p dist
mkdir -p assets

# 既存の出力ファイルを dist に移動
[ -f combined_output.txt ] && mv combined_output.txt dist/
[ -f combined_code.txt ] && mv combined_code.txt dist/

echo "✅ ディレクトリ構造の初期化完了！"
tree -L 2

