const svg = d3.select("svg");
const row = 10;
const col = 10;
const size = 30;

for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++) {

        const h = Math.random() * 360;
        const s = 70 + Math.random() * 30;   // 70〜100%
        const l = 40 + Math.random() * 20;   // 40〜60%
        const baseColor =  `hsl(${h}, ${s}%, ${l}%)`

        svg.append("rect")
            .attr("x", 50 + size * j)
            .attr("y", 50 + size * i)
            .attr("width", size)
            .attr("height", size)
            //.attr("fill", `hsl(${Math.random()*360}, 100%, 50%)`)
            .attr("fill", baseColor)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .on("mouseover", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", "white")
                    .attr("transform", "scale(1.2)");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("fill", baseColor)
                    .attr("transform", "scale(1)");
            });
    }
}
