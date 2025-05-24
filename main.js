const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

const N = 30

const nodes = d3.range(N).map(i => ({ id: i }));
nodes.forEach(d => d.infected = false);


const links = [];
for (let i = 0; i < N; i++) {
    const linkCount = Math.floor(Math.random() * 2) + 1; // 1〜3本リンク
    for (let j = 0; j < linkCount; j++) {
        const target = Math.floor(Math.random() * N);
        if (target !== i && !links.some(l => (l.source === i && l.target === target) || (l.source === target && l.target === i))) {
            links.push({ source: i, target: target });
        }
    }
}


// シミュレーション定義
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2));

// リンク描画
const link = svg.append("g")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 2)
    .selectAll("line")
    .data(links)
    .enter()
    .append("line");



const nodeGroup = svg.append("g");
nodeGroup
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 15)
    .attr("fill", "#ccc")
    .attr("stroke", "#333")
    .attr("stroke-width", 1.5);

const node = nodeGroup.selectAll("circle");  // ← 必ずこれを後に定義！


// tick更新
simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x = Math.max(15, Math.min(width - 15, d.x)))
        .attr("cy", d => d.y = Math.max(15, Math.min(height - 15, d.y)));
});


function infect(nodeId, delay = 0, fromId = null) {
    const targetNode = nodes.find(d => d.id === nodeId); // ← データ
    const nodeSelection = nodeGroup.selectAll("circle"); // ← セレクション


    if (!targetNode || targetNode.infected) return;

    targetNode.infected = true;

    nodeSelection
        .filter(d => d.id === nodeId)
        .transition()
        .delay(delay)
        .duration(300)
        .attr("fill", "crimson");



    // もし fromId があるなら → そこからのリンクを色付け
    if (fromId !== null) {
        const linkMatch = links.find(l =>
            (l.source.id === fromId && l.target.id === nodeId) ||
            (l.source.id === nodeId && l.target.id === fromId)
        );

        if (linkMatch) {
            const sx = linkMatch.source.x;
            const sy = linkMatch.source.y;
            const tx = linkMatch.target.x;
            const ty = linkMatch.target.y;

            svg.append("circle")
                .attr("r", 4)
                .attr("fill", "orange")
                .attr("cx", sx)
                .attr("cy", sy)
                .transition()
                .delay(delay)
                .duration(600)
                .ease(d3.easeLinear)
                .attr("cx", tx)
                .attr("cy", ty)
                .remove();
        }
    }


    if (fromId !== null) {
        d3.selectAll("line")
            .filter(l =>
                (l.source.id === fromId && l.target.id === nodeId) ||
                (l.source.id === nodeId && l.target.id === fromId)
            )
            .transition()
            .delay(delay)
            .duration(600)
            .ease(d3.easeLinear)
            .attr("stroke", "crimson")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8 8")
            .attr("stroke-dashoffset", 0);
    }

    // 隣接ノード取得
    const neighbors = links
        .filter(l => l.source.id === nodeId || l.target.id === nodeId)
        .map(l => (l.source.id === nodeId ? l.target.id : l.source.id));

    // 感染を伝播
    neighbors.forEach((neighborId, i) => {
        setTimeout(() => infect(neighborId, delay + 200, nodeId), 600 + i * 200);
    });
}

setTimeout(() => infect(0), 1000);
