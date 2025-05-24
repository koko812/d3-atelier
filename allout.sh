#!/bin/bash

# 出力ファイル
output_file="$HOME/Downloads/combined_output.txt"

# 初期化
echo "===== 📁 Directory Tree =====" > "$output_file"
tree -I "node_modules|.git|*.db" >> "$output_file"
echo "" >> "$output_file"

# 対象拡張子（必要に応じて追加可能）
extensions=("html" "js" "md" "sh")

# 各拡張子ごとにファイルを探して出力
for ext in "${extensions[@]}"; do
  find . -maxdepth 1 -type f -name "*.${ext}" | sort | while read -r file; do
    echo -e "\n\n========== 📄 ${file} ==========" >> "$output_file"
    cat "$file" >> "$output_file"
  done
done

echo "✅ 出力完了: ${output_file}"

