import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import styles from '../styles/PieChart.module.css';

function PieChart({ data, title }) {
    const ref = useRef();

    useEffect(() => {
        // 清除之前的 SVG 内容
        d3.select(ref.current).selectAll("*").remove();

        if (!data || data.length === 0) {
            return; // 如果没有数据，不执行后续代码
        }

        const totalValue = data.reduce((sum, d) => sum + d.value, 0);
        if (totalValue === 0) {
            return; // 如果所有值都是 0，不绘制图表
        }

        const width = 400;
        const height = 200;
        const radius = Math.min(width, height) / 3;

        const svg = d3.select(ref.current)
            .attr("width", width)
            .attr("height", height);

        const color = d3.scaleOrdinal()
            .domain(["Agree", "Disagree"])
            .range(["#eee", "#ffdc68"]);  // 定义颜色

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const pie = d3.pie()
            .value(d => d.value)
            .sort((a, b) => {
                // 确保 "Agree" 在右侧，"Disagree" 在左侧
                if (a.label === 'Agree' && b.label === 'Disagree') return -1;
                if (a.label === 'Disagree' && b.label === 'Agree') return 1;
                return 0;
            });

        const path = d3.arc().outerRadius(radius).innerRadius(0);

        const data_ready = pie(data);

        // 绘制饼图
        g.selectAll('path')
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => color(d.data.label));

        // 固定标签位置
        const labelPositions = {
            "Agree": { x: -radius -65, y: 15 },
            "Disagree": { x: -radius - 65, y: -15 },
        };

        // 添加标签
        g.selectAll('text')
            .data(data_ready)
            .enter()
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('x', d => labelPositions[d.data.label].x)
            .attr('y', d => labelPositions[d.data.label].y)
            .text(d => `${d.data.label}: ${d.data.value.toFixed(1)}%`);

        // 绘制图例
        const legend = svg.append("g")
            .attr("transform", "translate(300, 10)")
            .selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(d => d);

    }, [data]);

    const chartHeight = 200; // 设置图表高度，用于占位

    return (
        <div style={{ minWidth: '400px', minHeight: `${chartHeight + 30}px`, backgroundColor: '#fff', padding: '10px' }}>
            <h3>{title}</h3>
            {data && data.length > 0 && data.reduce((sum, d) => sum + d.value, 0) > 0 ? (
                <svg ref={ref}></svg>
            ) : (
                // 占位元素，保持布局一致
                <div style={{ width: '400px', height: `${chartHeight}px` }}></div>
            )}
        </div>
    );
}

export { PieChart };
