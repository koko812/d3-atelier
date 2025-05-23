export function kochTransform([p1, p2]) {
    const [x1, y1] = p1;
    const [x5, y5] = p2;
    const dx = x5 - x1, dy = y5 - y1;

    const x2 = x1 + dx / 3, y2 = y1 + dy / 3;
    const x3 = 0.5 * (x1 + x5) - Math.sqrt(3) * (y5 - y1) / 6;
    const y3 = 0.5 * (y1 + y5) + Math.sqrt(3) * (x5 - x1) / 6;
    const x4 = x1 + 2 * dx / 3, y4 = y1 + 2 * dy / 3;

    return [
        [p1, [x2, y2]],
        [[x2, y2], [x3, y3]],
        [[x3, y3], [x4, y4]],
        [[x4, y4], p2]
    ];
}

export function drawKoch(svg, { depth, mode }) {
    const g = svg.select("g");
    g.selectAll("line").remove();

    let segments = (mode === "line")
        ? [[ [700, 250], [100, 250]]]
        : [
            [[400, 50], [250, 300]], // ←ここを先頭に
            [[250, 300], [550, 300]],
            [[550, 300], [400, 50]]
        ];

    for (let i = 0; i < depth; i++) {
        segments = segments.flatMap(kochTransform);
    }

    g.selectAll("line")
        .data(segments)
        .enter()
        .append("line")
        .attr("x1", d => d[0][0])
        .attr("y1", d => d[0][1])
        .attr("x2", d => d[1][0])
        .attr("y2", d => d[1][1])
        .attr("stroke", "black")
        .attr("stroke-width", 0.5) // ← 細くする
        .attr("vector-effect", "non-scaling-stroke"); // ← ズーム時も固定サイズ

}
