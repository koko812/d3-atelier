import { drawKoch } from '../shapes/koch.js';

const svg = d3.select("svg");
const g = svg.select("g");
const message = document.getElementById("message");

let depth = 0;
let mode = "line";
const maxDepth = 6;

function render() {
    drawKoch(svg, { depth, mode });
    message.textContent = (depth >= maxDepth)
        ? "これ以上は増やせません。"
        : "";
}

// ボタンイベント
document.getElementById("increase").addEventListener("click", () => {
    if (depth < maxDepth) {
        depth++;
        render();
    }
});

document.getElementById("reset").addEventListener("click", () => {
    depth = 0;
    render();
});

document.getElementById("toggleMode").addEventListener("click", () => {
    mode = mode === "line" ? "triangle" : "line";
    render();
    document.getElementById("toggleMode").textContent =
        `図形を切り替え（現在: ${mode === "line" ? "直線" : "三角形"}）`;
});

// ズーム処理
const zoom = d3.zoom()
    .scaleExtent([1, 50])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

svg.call(zoom);

// クリックでその位置にズームイン
svg.on("click", function (event) {
    const [x, y] = d3.pointer(event);
    const t = d3.zoomTransform(svg.node());
    const scale = Math.min(t.k * 1.5, 10);

    const newTransform = d3.zoomIdentity
        .translate(svg.attr("width") / 2, svg.attr("height") / 2)
        .scale(scale)
        .translate(-x, -y);

    svg.transition()
        .duration(500)
        .call(zoom.transform, newTransform);
});

render(); // 初期描画
