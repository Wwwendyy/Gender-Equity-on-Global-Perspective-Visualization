import * as d3 from "d3";
import { useEffect, useRef } from "react";

function BarChart({ data, title }) {
    console.log(data);
    const ref = useRef();

    useEffect(() => {
        d3.select(ref.current).selectAll("*").remove();

        if (!data || data.length === 0) {
            return;
        }

        const width = 450; // Chart width
        const height = 600; // Chart height
        const margin = { top: 20, right: 50, bottom: 80, left: 50 };

        const svg = d3
            .select(ref.current)
            .attr("width", width)
            .attr("height", height);

        // Stack data with "Disagree" first (bottom) and "Agree" second (top)
        const stack = d3.stack().keys(["disagreePercentage", "agreePercentage"]);
        const stackedData = stack(
            data.map((d) => ({
                question: d.question,
                agreedResponses: d.agreedResponses,
                disagreedResponses: d.disagreedResponses,
                agreePercentage: d.agreePercentage,
                disagreePercentage: d.disagreePercentage,
            }))
        );
        console.log(stackedData);

        const x = d3
            .scaleBand()
            .domain(data.map((d) => d.question))
            .range([margin.left, width - margin.right])
            .padding(0.2);

        const y = d3
            .scaleLinear()
            .domain([0, 100]) // 100% total
            .nice()
            .range([height - margin.bottom, margin.top]);

        const color = d3
            .scaleOrdinal()
            .domain(["Disagree", "Agree"])
            .range(["#658ec4", "#eee"]); // "Disagree" blue, "Agree" light gray

        // Create the x-axis
        svg
            .append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        svg
            .append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(y).ticks(5))
            .call((g) => g.select(".domain").style("stroke", "black"));

        // Draw stacked bars
        const layers = svg
            .selectAll(".layer")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("class", "layer")
            .attr("fill", (d, i) => color(i === 0 ? "Disagree" : "Agree")); // Match color to layer order

        layers
            .selectAll("rect")
            .data((d) => d)
            .enter()
            .append("rect")
            .attr("x", (d) => x(d.data.question))
            .attr("y", (d) => y(d[1])) // Position top of stack
            .attr("height", (d) => y(d[0]) - y(d[1])) // Height of stack segment
            .attr("width", x.bandwidth());

        // Add legend below chart
        const legend = svg
            .append("g")
            .attr("transform", `translate(${margin.left}, ${height - margin.bottom + 20})`);

        legend
            .selectAll(".legend")
            .data(color.domain())
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${i * 100}, 0)`);

        legend
            .selectAll(".legend")
            .append("rect")
            .attr("x", 0)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", color);

        legend
            .selectAll(".legend")
            .append("text")
            .attr("x", 25)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text((d) => d);
    }, [data]);

    if (!data || data.length === 0) {
        return null; // Don't render if no data
    }

    return (
        <div>
            <h3>{title}</h3>
            <svg ref={ref}></svg>
        </div>
    );
}

export { BarChart };