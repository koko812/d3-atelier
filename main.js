const svg = d3.select("svg");
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
