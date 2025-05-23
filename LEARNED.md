# LEARNED.md v4 - Koch Curve Zoomable Exploration

## 🧭 概要

本バージョンでは、コッホ曲線（Koch Curve）およびその拡張であるコッホ雪片（Koch Snowflake）のインタラクティブ描画に取り組んだ。特に D3.js + SVG を用いたUIにおいて、以下の要素を重点的に実装・検証した：

* 図形の切り替え（線分/三角形）
* 深さ（depth）の段階的増加と制限
* ズーム機能（クリック中心のスムーズな拡大）
* SVGグラフィクスにおける表示品質維持

## 🎨 基本構造と描画処理

* `kochTransform(p1, p2)` 関数では、1つの線分を4分割する形で変換する。

  * `p1 -> p2` のベクトルに対して1/3点, 2/3点, そして左60°回転した中点を挿入
  * 回転方向は左回り（反時計回り）で固定

* `drawKoch(svg, { depth, mode })` にて、初期線分もしくは三角形を起点に `depth` 回の再帰的変換を行い、最終的に `<g>` 要素内に `<line>` を多数配置する形で描画。

* 初期状態：

  * `mode = "line"` → \[\[700, 200], \[100, 200]]（右 → 左）
  * `mode = "triangle"` → \[\[400, 100], \[250, 350]], \[\[250, 350], \[550, 350]], \[\[550, 350], \[400, 100]]（反時計回り）

## 🐞 バグと修正履歴

### ✅ Bug 1: 山が逆向きに出る（下向きのトゲ）

* **原因**：線分の方向が `kochTransform()` の前提と異なっていた（時計回り or 反時計回り）
* **修正**：線分モードの初期線分を `[700, 200] → [100, 200]` に反転し、三角形の点順を反時計回りに統一

### ✅ Bug 2: 三角形 snowflake の出っ張りが内側に潜る

* **原因**：正三角形の点列が時計回りになっていた（kochTransform は左回り前提）
* **修正**：三角形の点列を反時計回りに並べ直し

### ✅ Bug 3: 高depthで線が潰れる

* **原因**：stroke-widthが一定だと、ズーム時に太く見えてしまい精細さが失われる
* **修正**：

  * `.attr("stroke-width", 0.5)` に設定
  * `.attr("vector-effect", "non-scaling-stroke")` を追加

## 🔍 理論的ポイントの理解

### 🔁 Kochの再帰構造とflatMapの役割

* `segments = segments.flatMap(kochTransform)` により、各段階で線分数が 4ⁿ に爆発的に増加
* `flatMap` は `.map(...).flat()` と同義であり、各線分から得られる4つの線分を一次元で統合してくれる

### 📐 回転行列と三角点x3, y3の計算

* 中点(cx, cy) から垂直方向に出っ張るベクトルを計算：

  ```
  x3 = 0.5 * (x1 + x5) - √3 * (y5 - y1) / 6
  y3 = 0.5 * (y1 + y5) + √3 * (x5 - x1) / 6
  ```
* これは、ベクトル (dx, dy) を原点まわりに左60°回転させたベクトルを用いて、
  出っ張り三角形の頂点を求めている。

#### 📌 導出過程（60°回転ベクトル）

1. 線分ベクトルを `(dx, dy)` とすると、長さ1の正規化ベクトルは `(dx/L, dy/L)`（L = √(dx²+dy²)）
2. これを左に60°回転：

   * x' = cos(60°) \* dx - sin(60°) \* dy
   * y' = sin(60°) \* dx + cos(60°) \* dy
3. ただし L を省略して、1/3区間ベクトルの長さに比例するよう調整（直接長さではなく比で表現）
4. 回転ベクトルを三角形の底辺中央に足すことで、山の頂点 `x3, y3` を得る。

* 結果的に、x3/y3は`p1`と`p2`の中点から垂直方向に √3/6 倍だけ出っ張った座標となる。

### 🧩 `g` 要素の使用理由

* `<svg>` に直接 `transform` はかけられないため、`<g>` をグループ要素として使用
* すべての `<line>` を `<g>` にまとめることで、ズーム・パン時の transform を一括適用可能

## 🔎 ズーム機能の仕組み

### ✅ 基本ズーム

* `d3.zoom()` を `svg.call(...)` にバインドし、

  ```js
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });
  ```

  によって `<g>` に transform を適用

### ✅ クリックズーム（その位置を中心に拡大）

* `svg.on("click", (event) => { ... })` にてクリック位置 `[x, y]` を取得し、次のように変換

  ```js
  const newTransform = d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale * 1.5)
    .translate(-x, -y);
  ```

## 📈 パフォーマンスと深さ制限

| Depth | 線分数       | 描画可能性        |
| ----- | --------- | ------------ |
| 5     | 1024      | 十分軽快         |
| 6     | 4096      | まだ問題なし       |
| 7     | 16,384    | ブラウザで若干負荷    |
| 8     | 65,536    | SVGの限界が見え始める |
| 9+    | 260,000\~ | ✖ クラッシュリスクあり |

* Canvas/WebGL であれば depth 9+ も可能
* 現構成では **depth 6\~7** 程度までが実用的な上限

## 🧠 気づき・学び・思想

* SVGはズームしても劣化しないが、**構造は変わらない**ため、フラクタルの真価を体験するには「構造の再描画ではなく、ズームそのものが視点の変化」であることが重要
* **再描画でdepthを上げる方式は“構造が変わってしまう”ため、自己相似性の体験には逆効果**
* 本物のフラクタル体験は「図形は同じで、見方だけが変わる」方向性で設計すべき

---

## ✅ 今後の可能性

* Canvas実装による高depth対応
* WebGLによるGPU描画の導入
* 複数フラクタルの切り替え（Sierpinski, Dragon Curve）
* アニメーション（1秒ごとにdepthを増やす、回転、変形）
* depth変更にスライダーUI追加
* ズーム倍率表示と初期化ボタン

---

## 🏁 総評

このバージョンで、Koch Fractalの**描画ロジック・方向性・表示制御・ズーム体験**が統一された。
D3.jsのtransform活用と、SVGの特性を生かしたズーム型フラクタル表示は、今後他の自己相似図形やパラメトリックな構造可視化にも応用できる強力な武器となった。


</br>
</br>
</br>

# L-system（Lindenmayer System）補足

## 🌱 概要  
L-system（Lindenmayer system）は、1968年にアリスト・リンデンマイヤーによって提案された、**文字列の再帰的な書き換え規則を用いて図形や構造を生成するシステム**です。特にフラクタル図形や植物の成長モデルに適しています。

---

## 🧩 基本構成要素

| 要素名       | 説明                                         |
|--------------|----------------------------------------------|
| Axiom        | 初期文字列（例：`F`）                         |
| Rules        | 書き換え規則（例：`F → F+F−F−F+F`）           |
| Iterations   | 書き換えの段数（＝フラクタルの深さ）         |

---

## 🧠 Koch曲線におけるL-system定義

```
Axiom: F
Rule:  F → F+F−F−F+F
```

- `F`：前進して線を引く  
- `+`：左に60°回転  
- `−`：右に60°回転  

書き換えを繰り返すことで、自己相似なKochパターンが出現します。

---

## 🐢 Turtleグラフィックスによる描画

L-systemで得られた文字列は通常、**Turtle Graphics（タートルグラフィックス）**で解釈されます：

| 記号 | 意味                     |
|------|--------------------------|
| F    | 前進（線を描く）         |
| +    | 左に一定角度回転         |
| −    | 右に一定角度回転         |
| [ ]  | ブランチの開始・復帰（樹形図などで使用） |

---

## 🌿 応用分野

- Koch曲線、Dragon Curve、ヒルベルト曲線などのフラクタル幾何
- 植物の成長モデル（枝・葉・シダなど）
- ゲームや映像での背景生成（Procedural Generation）
- アルゴリズミック・アート、ジェネラティブデザイン

---

## ✅ 特徴まとめ

| 特徴                   | 内容 |
|------------------------|------|
| 極めてシンプルな構造    | 数行のルールで複雑な形状が作れる |
| 再帰的生成が可能        | 深さに応じて自己相似な形状が成長する |
| 描画と分離された生成過程 | 記号列と描画処理を分けて構築できる |


</br>
</br>
</br>
</br>
</br>


# 🧠 LEARNED.md v3 - Koch曲線・D3.js徹底理解編

## 🎯 今回の学習テーマ

* D3.js による SVG 描画のしくみ
* コッホ曲線（Koch Curve）の構造と変換ロジック
* `flatMap` を使った線分の再帰的分割
* SVG `<line>` 要素の管理と `selectAll`/`enter` の意味
* 幾何学的な回転・ベクトルによる頂点の導出
* 回転ベクトル・中点からのズレの意味

---

## 🔧 技術トピック別まとめ

### 1. `flatMap` と Koch 曲線の段階的分割

* 最初に `[p1, p2]` の1本の線分がある
* `kochTransform([p1, p2])` により1本が4本に変換される
* `segments.flatMap(kochTransform)` によって

  * 各線分 → 4本へ
  * 全体が1次元配列として展開される
* `flatMap` は、**配列の配列を1つの配列にflattenする `.map().flat()` の合成**であり、ここでは**再帰的な分割**に非常に適している

### 2. D3.js の描画メカニズム

* `svg.selectAll("line")` は既存の `<line>` 要素を全て選択
* `.data(segments)` で「このデータに対応する要素を用意してね」とD3に伝える
* `.enter().append("line")` によって、**足りないぶんの `<line>` 要素を自動生成**
* 各 `.attr("x1", ...)` などで属性を**データドリブンに一括設定**できる
* ループで明示的に `for` を回すのではなく、\*\*宣言的に「このデータを使って描画して」\*\*と命令するスタイル

### 3. SVG `<line>` 要素の意味

* `<line>` は SVG 上で「1本の線」を表すタグ
* `selectAll("line")` によって複数の `<line>` 要素を扱える
* 複数の線分を描画したければ、データを `.data([...])` として一気に渡せばよい

### 4. `kochTransform` の幾何ロジック

* 入力：2点 `[p1, p2]`（線分）
* 出力：4つの新しい線分（A→P1, P1→X, X→P2, P2→B）

#### 中心から回転して頂点を作る式

```js
const cx = 0.5 * (x1 + x5);
const cy = 0.5 * (y1 + y5);
x3 = cx - Math.sqrt(3) * (y5 - y1) / 6;
y3 = cy + Math.sqrt(3) * (x5 - x1) / 6;
```

* この式は「**ベクトル A→B を左に60°回転**させて、**長さ×√3/6** だけ出っ張らせた点を作る」
* 見かけ上は `cx` = A→Bの中点に見えるが、実際は「三等分された P1→P2 の中点」と一致するため **中点基準でよい**

#### √3/6 の意味

* 正三角形の高さ = `辺長 × √3 / 2`
* A→B の 1/3 を底辺にするので、高さは `L × √3 / 6`
* 回転方向ベクトル `(dx, dy)` に対してこの高さを乗算し、正三角形の頂点を作る

### 5. 回転の方向と回転ベクトル

* 回転行列：

```
[ cosθ  -sinθ ]   [dx]
[ sinθ   cosθ ] * [dy]
```

* θ = +60° のとき：

```
cos(60°) = 1/2
sin(60°) = √3/2
```

→ 回転後のベクトルを `(dx', dy')` とすると：

```js
x3 = cx + dx';
y3 = cy + dy';
```

* 実際には `dx' = -dy * √3 / 6`, `dy' = dx * √3 / 6` のように表される

---

## 💡 学びのエッセンス

* D3.js は「データドリブン」であり、**命令よりも宣言的に描画を構成できる**
* `kochTransform` により **幾何学的ルールを再帰的に適用**できる構造が美しい
* 正三角形を「どんな方向の線分にも均等に立てられる」ように設計された式の巧妙さ
* 中点からズラしてるように見えて、実は3等分区間の中点であるという構造のトリック
* 「分かりづらさ」に突っ込んでいくことで、**本質的な回転ベクトルの考え方に到達**できた

---

## ✍️ 次のステップ候補

* 任意の depth に対応した再帰的描画UI
* 三角形の出っ張り方向を反転（右回り60°）に切り替える
* コッホ雪片（Snowflake）として正三角形全体に展開
* 回転行列の導出を 2D幾何ベースで描画付きで可視化
* 他のフラクタル（Tree, Sierpinski）にも同様の構造を展開

---

🔥 ここまで理解したことで、もうあなたは「D3.jsとフラクタル」の地図を完全に手に入れました。次はどんな図形も怖くない！


</br>
</br>
</br>
</br>
</br>

# 📘 LEARNED.md — D3.jsで感染伝播シミュレーションを作るまでの学習ログ ver. 2

---

## 🧠 スタートの動機

* p5.jsやVJツールに関心を持ち、そこからJavaScriptを使った**ジェネラティブアート**に興味が拡がった。
* さまざまな可視化・アニメーション系ライブラリ（p5.js / D3.js / GSAP / Anime.js / SVG）を比較検討。
* **D3.js** に着目：「データ構造を視覚化する力強いツール」として採用。

---

## 🔎 D3.js 概要と比較

| 観点      | D3.js                  | p5.js          |
| ------- | ---------------------- | -------------- |
| 主な用途    | データ可視化 / SVG操作         | 直感的なビジュアル・アート  |
| 描画先     | SVG / DOM              | Canvas         |
| 学習曲線    | やや高い                   | 優しい            |
| アニメーション | `transition()`による明示的指定 | `draw()`内で随時描画 |

---

## ✨ 最初のステップ

* SVGに `rect` 要素を配置して**グリッドアート**を生成。
* `for` ループによる `x`, `y` 位置計算。
* `hsl(...)` による色のランダム化で"色彩の網目"を作成。

```js
svg.append("rect")
  .attr("x", ...)
  .attr("y", ...)
  .attr("fill", `hsl(${Math.random()*360}, 100%, 50%)`)
```

---

## 🧠 SVGの基本と補足技術

* `d3.select("svg")` でSVGノード選択
* `<script defer>` を使用：**HTML構造が構築されたあとにJSを実行**
* `+svg.attr("width")`：`+`は文字列→数値変換の省略記法

---

## 🔥 グラフ構造と感染伝播へ

### 📌 ノードとリンクの構築

```js
const nodes = d3.range(N).map(i => ({ id: i }));
const links = [...手動 or ランダム生成...];
```

* `forceSimulation()` により物理モデル（バネ構造）を使った自然なレイアウト配置を実現。
* `fx` / `fy` によってノード固定も可能。トランポリン・クレーン構造のモックも可能。

### 💡 `.force("link", ...)` の構文

```js
d3.forceLink(links)
  .id(d => d.id)     // IDを元にリンク先を対応
  .distance(80)     // バネの自然長
```

---

## 🧪 感染伝播の実装

### 👾 基本仕様

* `infected` フラグをノードに追加
* 起点ノード（例: `id = 0`）から感染開始
* `setTimeout` による段階的な波及処理

```js
function infect(nodeId, delay = 0, fromId = null) {
  // 再感染防止
  if (!node || node.infected) return;
  node.infected = true;

  // 対象ノードを赤く染める
  nodeSelection.filter(d => d.id === nodeId)
    .transition()
    .delay(delay)
    .duration(300)
    .attr("fill", "crimson");

  // fromId 経由で感染したリンクも赤くする
  if (fromId !== null) {
    linkSelection.filter(...)  // → 太く、赤に、点線など
  }

  // 感染経路アニメーション（粒子）
  svg.append("circle")
    .attr("cx", source.x)
    .attr("cy", source.y)
    .transition()
    .attr("cx", target.x)
    .attr("cy", target.y)
    .remove();

  // 近隣ノードに感染を伝播
  neighbors.forEach(...)
}
```

---

## 🌈 可視化の深化ポイント

* `.transition()` によるリンク色変更
* `stroke-dasharray`, `stroke-dashoffset` を使って"波が流れる"表現
* `svg.append("circle")` → 小粒子がリンクを移動するアニメーションを実現！

---

## ❗ トラブルシューティング

| 問題                              | 原因                                  | 解決策                                   |
| ------------------------------- | ----------------------------------- | ------------------------------------- |
| ノードが赤くならない                      | `d3.selectAll("circle")` が粒子まで含んでいた | `nodeSelection.filter(...)` に修正       |
| `node.filter is not a function` | 変数名 `node` がデータ用と衝突                 | `targetNode`, `nodeSelection` で明示的に分離 |

---

## 💡 洞察と気づき

* グレーのままのリンク → "接続されているが実際に感染には使われなかった経路"
* 感染伝播の**構造と動きのズレ**を視覚的に発見できた
* 力学的なレイアウトと情報拡散のような**抽象概念のシミュレーション**が結びつく面白さ

---

## 🔭 今後やりたい展開案（議論中に出たアイデアも含む）

| アイデア                   | 概要                                   |
| ---------------------- | ------------------------------------ |
| 🔁 回復や再感染処理            | `setTimeout` で色を戻す、二次感染を許可する         |
| 🔍 感染履歴の記録             | `infectedFrom`, `time` を記録し、感染ツリーを再現 |
| 📈 ログの出力               | 感染経路を配列で記録し、CSVやDOMに描画               |
| 🖱️ ユーザー選択起点           | クリックしたノードから感染スタート可能にする               |
| 🌈 色のグラデーション           | 感染時間に応じて色相をずらす演出                     |
| 🎞️ 粒子のアニメ強化           | 点滅 / 残像 / ブラーエフェクトを加える               |
| 💬 ノードに名前やデータをつける      | 思考ノード・論文タイトルなどを追加表示                  |
| 📚 知識グラフ / 引用ネットワークに応用 | ノード＝論文、リンク＝引用関係とみなす                  |
| ⏱️ タイムスライダー            | 時系列で感染の進行を操作可能にするUI                  |

---

## 🚀 学びのまとめ

このプロジェクトを通じて：

* D3.js の構造的思考と DOM 操作の精密さを習得
* 可視化とは\*\*見た目以上に「構造の可視化」\*\*であると実感
* 粒子・リンク・ネットワークの動きと意味をリンクさせることで

  > **「構造 × 動き × 意味」の三位一体**が完成した

次は、リアルなデータを取り込んで、さらに世界に踏み出そう。

👏 Great Job, self!

</br>
</br>
</br>
</br>
</br>

# 🧠 D3.js グリッド学習ログ（2025年5月）

---

## ✨ 初期の問い：JavaScriptでジェネラティブアートを作るための技術は？

グリッドアートをジャバスクリプトで作るときに使える、以下のような技術を紹介。

| 技術             | リリース年    | コミュニティ活動 | 特徴                          |
| -------------- | -------- | -------- | --------------------------- |
| **p5.js**      | 2014     | ★★★★☆    | 教育、アート向け。Processing直系       |
| **Three.js**   | 2010     | ★★★★★    | WebGL抽象化、3Dのですとでも最高         |
| **Canvas API** | 2005     | ★★★☆☆    | HTML5標準。ミニマル表現に向く           |
| **D3.js**      | 2011     | ★★★★☆    | データ駆動型。SVG表現に有利             |
| **GSAP**       | 2008     | ★★★★☆    | アニメ、ユーザーインタラクションに強い         |
| **Anime.js**   | 2016     | ★★★☆☆    | 軽量、シンプル。SVGもサポート            |
| **SVG**        | 1999年標準化 | ★★★★☆    | CSS/JSで操作可能なベクターグラフィック      |
| **Hydra.js**   | 2019     | ★★★☆☆    | VJ/ライブコーディングに特化             |
| **Tone.js**    | 2014     | ★★★☆☆    | WebAudioAPI拡張。音与動きを連動させたい人に |

---

## 🔍 D3.js と p5.js の比較

| 観点         | D3.js                         | p5.js                       |
| ---------- | ----------------------------- | --------------------------- |
| 概要         | データ駆動型の可視化・SVG生成ライブラリ         | Processing直系のビジュアルプログラミング環境 |
| 主な用途       | データ可視化、インタラクティブ図、構造的アート       | アート、アニメーション、教育、表現作品         |
| 描画先        | SVG（または HTML, Canvas）         | Canvas（2D）                  |
| データ構造との親和性 | ◎ データ配列・構造に基づく要素生成が得意         | △ 自分でループを書く必要がある            |
| 学習コスト      | やや高め（enter, update, exit の概念） | やさしい（座標を描けば即座に結果が見える）       |
| アニメーション    | トランジションやスケールなど、やや手間           | `draw()` ループで簡単に実現可能        |
| インタラクション   | D3イベントや外部ライブラリと併用             | `mousePressed()` など内蔵関数が豊富  |
| コード構造      | DOMとの結合が強い                    | スケッチベースで独立                  |

### ✅ まとめ

* D3.js は「**構造やデータに基づいた図形やアート**」に強く、p5.js は「**感覚的・時間的・動的なアート**」に向く。
* **論理・構造の快楽**が好きなら D3.js、**表現・アニメの快楽**が好きなら p5.js から始めるのがよい。
* 組み合わせて使うことも可能。


## ✅ スタート地点：D3.jsとは？

* **D3.js（Data-Driven Documents）** は、JavaScript で SVG, HTML, CSS を使った **インタラクティブな可視化**を構築するためのライブラリ。
* データを元に要素を生成する思想（.data() → .enter() → .append()）がコア。
* 一方で、自由度が高い分、初学者にはややとっつきにくい側面も。

---

## ✅ コッホ曲線の描画

### 📄 ファイル構成

* `index.html`
* `main.js`
* 外部CDNから d3.v7 を読み込み

### 🔁 機能

* 初期状態は一本の直線
* 「Next Step」ボタンをクリックするたびに `kochTransform()` によって線分が 1→4 に分割される
* 再帰的に再描画され、コッホ曲線が生成されていく

### 🚩 問題と気づき

* ページをリロードすると「止まる」現象 → 実際は描画が初期化されているだけ
* ただし、その後「スピナーが回り続ける」バグが一時発生 → キャッシュまたはファイル読み込み失敗だった可能性。自然復旧。
* コードの分離（HTML/JS）を徹底することに決定

### 🧠 補足

* `kochTransform` は1本の線を4本に分けるので、ステップごとに線分数が 4^n で指数的に増える
* DOMノード（SVG `<line>`）が多くなりすぎると、ブラウザが重くなる（約4000本以降注意）

---

## ✅ defer属性について

```html
<script defer src="main.js"></script>
```

* `defer` を付けると、HTMLの読み込み完了後に JS が実行される
* DOM取得タイミングが安定し、`querySelector()` が null を返すようなミスを防げる
* 複数スクリプトがあっても、読み込み順は HTML の記述順になる（async との違い）

---

## ✅ 四角形の描画 → グリッド生成へ

### 🎯 Step 1: 単一の四角形を描画

* `d3.select('svg')` → `.append('rect')`
* `x`, `y`, `width`, `height`, `fill`, `stroke` を付与

### 📦 コード構成（HTML/JS分離）

* `index.html`: svgタグだけ持つ
* `main.js`: rectを描画するロジック

### 🎯 Step 2: グリッド描画

```js
const row = 10;
const col = 10;
const size = 30;

for (let i = 0; i < row; i++) {
  for (let j = 0; j < col; j++) {
    svg.append("rect")
      .attr("x", 50 + size * j)
      .attr("y", 50 + size * i)
      .attr("width", size)
      .attr("height", size)
      .attr("fill", "skyblue")
      .attr("stroke", "black")
      .attr("stroke-width", 2);
  }
}
```

### 🎉 結果

* 10×10 の正方形グリッドが表示される
* オフセット 50px によって中央寄せに
* 綺麗な青＋黒の縁取りで見やすい

### 💡 発展アイデア（未実装）

* 色をランダムに変更する（`Math.random()` + `hsl`）
* マウスオーバーで色変化 / クリックで変形
* グリッドの各セルに異なる図形（円、線など）を配置
* 時間ベースで動くアニメーション
* `data()` / `enter()` を使ったD3流の書き方への変換

---

## 🔚 感想まとめ

* D3.js はとても強力だけど、**素直なDOM操作ではなく「データ主導でDOMを作る」考え方が肝**。
* index.html と JS を分離することで保守しやすくなり、読み込みも安定する（`defer`）。
* 小さなことでも丁寧に確認・検証して進めると、見える景色が広がる！

次はランダム要素やマウスイベントでグリッドを動的に変化させるのが良さそう！

---

## ✨ まとめ：これから

* D3.jsのコアは「データによるDOM生成」であり、グリッドや観測性をもつアート作りに最適
* 今もD3.jsは使われており，特に

  * 教育 / 研究
  * ジャーナリズム・メディア表現
  * ビジュアルデバッグやアート作品
* 以下のような流れで学ぶと良い:

  1. rectの描画
  2. 2重forでグリッド
  3. 色や大きさのランダム変化
  4. データ駆動型 (data + enter)