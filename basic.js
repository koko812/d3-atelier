const svg = d3.select("svg");
const row = 10;
const col = 10;
const size = 30;

for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {

        const h = Math.random() * 360;
        const s = 70 + Math.random() * 30;   // 70〜100%
        const l = 40 + Math.random() * 20;   // 40〜60%
        const baseColor = `hsl(${h}, ${s}%, ${l}%)`

        // 各四角の中心座標を計算
        const cx = 25 + (size+4) * j + (size+4) / 2;
        const cy = 25 + (size+4) * i + (size+4) / 2;

        // <g> を生成し、中心に移動
        const group = svg.append("g")
            .attr("transform", `translate(${cx}, ${cy})`);

        // 中心から -size/2, -size/2 の位置に rect を置く
        group.append("rect")
            .attr("x", -size / 2)
            .attr("y", -size / 2)
            .attr("width", size)
            .attr("height", size)
            .attr("fill", baseColor)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .on("mouseover", function () {
                d3.select(this.parentNode) // g 要素に対して
                    .raise()
                    .transition()
                    .duration(150)
                    .attr("transform", `translate(${cx}, ${cy}) scale(1.4)`);
            })
            .on("mouseout", function () {
                d3.select(this.parentNode)
                    .transition()
                    .duration(150)
                    .attr("transform", `translate(${cx}, ${cy}) scale(1)`);
            });
    }
}
