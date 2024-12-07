// GeoMap.js
import React from "react";
import { geoPath, geoMercator } from "d3-geo";
import { scaleOrdinal } from "d3-scale";
import { interpolateBuPu } from "d3-scale-chromatic";
import * as d3 from "d3";
import { processCountryData } from "../components/dataProcessing";

function GeoMap(props) {
    const { width, height, countries, personal_info, onCountryHover, onCountryClick } = props;

    if (!countries || !countries.features) {
        return <pre>Loading map data...</pre>;
    }

    // 使用共享的数据处理函数
    const { countryData, culturalRegions, culturalRegionIndices } = processCountryData(personal_info);

    const n = culturalRegions.length;

    // 定义 BuPu 颜色方案的三个主要色阶，表示分数等级，并转换为十六进制格式
    const scoreColors = [0.3, 0.6, 0.9].map(t => rgbToHex(interpolateBuPu(t)));

    // 为每个文化区域分配一个基础颜色
    const culturalColorScale = scaleOrdinal()
        .domain(culturalRegions)
        .range(d3.schemeCategory10.slice(0, n));


    // 生成颜色矩阵，先按分数等级，再按文化区域
    const colors = [];
    for (let j = 0; j < 3; j++) { // 分数等级：低、中、高
        for (let i = 0; i < n; i++) { // 文化区域
            const baseColor = culturalColorScale(culturalRegions[i]);
            const mixedColor = blendColors(baseColor, scoreColors[j], 0.5);
            colors.push(mixedColor);
        }
    }

    // 根据分数等级索引和文化区域索引获取颜色
    function getColor(culturalRegionIndex, scoreLevelIndex) {
        const index = scoreLevelIndex * n + culturalRegionIndex;
        return colors[index];
    }

    // 颜色混合函数
    function blendColors(color1, color2, weight) {
        const c1 = hexToRgb(color1);
        const c2 = hexToRgb(color2);

        // 混合颜色
        const r = Math.round(c1.r * (1 - weight) + c2.r * weight);
        const g = Math.round(c1.g * (1 - weight) + c2.g * weight);
        const b = Math.round(c1.b * (1 - weight) + c2.b * weight);

        return rgbToHex(`rgb(${r},${g},${b})`);
    }

    // RGB 颜色字符串转换为十六进制格式
    function rgbToHex(rgb) {
        const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
        if (!result) {
            return "#000000";
        }
        const r = parseInt(result[1], 10);
        const g = parseInt(result[2], 10);
        const b = parseInt(result[3], 10);

        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)
            .toUpperCase();
    }

    // 十六进制颜色转换为 RGB 对象
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(h => h + h).join('');
        }
        const bigint = parseInt(hex, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
        };
    }

    // 使用 Mercator 投影
    let projection = geoMercator()
        .scale(120)
        .translate([width / 2, height / 2 + 60]);

    let path = geoPath().projection(projection);

    // 绘制图例
    function renderLegend() {
        const legendItems = [];
        const cellWidth = 20;
        const cellHeight = 20;

        for (let j = 0; j < 3; j++) { // 分数等级
            for (let i = 0; i < n; i++) { // 文化区域
                const x = i * cellWidth;
                const y = j * cellHeight;
                const color = colors[j * n + i]; // 调整后的索引
                legendItems.push(
                    <rect key={`${i}-${j}`}
                          x={x}
                          y={y}
                          width={cellWidth}
                          height={cellHeight}
                          fill={color}
                          stroke="#000"
                    />
                );
            }
        }

        // 添加文本标签
        const labels = [];
        const regionLabelY = 2 * cellHeight + 24; // 调整文化区域标签的纵坐标
        const scoreLevels = ['Low', 'Medium', 'High'];
        const scoreLabelX = n * cellWidth + 10; // 调整分数等级标签的横坐标
        // 文化区域标签
        for (let i = 0; i < n; i++) {
            const x = i * cellWidth + cellWidth / 2;
            labels.push(
                <text key={`region-label-${i}`}
                      x={x}
                      y={regionLabelY}
                      fontSize="10"
                      textAnchor="end"
                      transform={`rotate(-45, ${x}, ${regionLabelY})`}>
                    {culturalRegions[i]}
                </text>
            );
        }
        // 分数等级标签
        for (let j = 0; j < 3; j++) {
            const y = j * cellHeight + cellHeight / 2 + 5;
            labels.push(
                <text key={`score-label-${j}`}
                      x={scoreLabelX}
                      y={y}
                      fontSize="10"
                      textAnchor="start">
                    {scoreLevels[j]}
                </text>
            );
        }

        return (
            <g transform={`translate(${width - n * cellWidth - 100}, ${height - 3 * cellHeight - 83})`}>
                {legendItems}
                {labels}
            </g>
        );
    }

    return (
        <svg width={width} height={height}>
            {countries.features.map((d, index) => {
                const countryCode = d.id;

                // 跳过百慕大
                if (countryCode === 'BMU' || countryCode === 'BM') return null;

                const data = countryData[countryCode];
                let color = "#EEE"; // 对于缺失数据的国家，使用灰色
                if (data) {
                    const culturalRegionIndex = culturalRegionIndices[data.cultural_region];
                    const scoreLevelIndex = data.scoreLevelIndex;
                    color = getColor(culturalRegionIndex, scoreLevelIndex);
                }
                const countryPath = path(d);
                if (!countryPath) return null;

                const countryName = d.properties.name; // 获取国家名称

                return (
                    <path key={index}
                          d={countryPath}
                          stroke="#ccc"
                          fill={color}
                          onMouseEnter={() => onCountryHover(countryCode, countryName)}
                          onMouseLeave={() => onCountryHover(null)}
                          onClick={(event) => {
                              // 计算 Tooltip 的位置
                              const rect = event.target.getBoundingClientRect();
                              const position = {
                                  x: rect.x + rect.width / 2 + window.scrollX,
                                  y: rect.y + rect.height / 2 + window.scrollY
                              };
                              onCountryClick(countryCode, countryName, position);
                          }}
                    />
                );
            })}
            {renderLegend()}
        </svg>
    );
}

export { GeoMap };
