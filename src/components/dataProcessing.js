// dataProcessing.js

export function processCountryData(personal_info) {
    if (!personal_info || personal_info.length === 0) {
        return { countryData: {}, culturalRegions: [], culturalRegionIndices: {} };
    }
 
    const countryData = {};
    const culturalRegionsSet = new Set();

    personal_info.forEach(info => {
        const countryCode = info.B_COUNTRY_ALPHA;
        const culturalRegion = info.cultural_region;
        culturalRegionsSet.add(culturalRegion);

        if (!countryData[countryCode]) {
            countryData[countryCode] = {
                cultural_region: culturalRegion,
                responses: [],
                avgScore: 0,
                scoreLevelIndex: 0,
            };
        }

        const answers = [info.Q28, info.Q29, info.Q30, info.Q31, info.Q32];
        const validAnswers = answers.filter(answer => answer !== null && answer !== undefined);

        if (validAnswers.length > 0) {
            const avgAnswer = validAnswers.reduce((sum, val) => sum + val, 0) / validAnswers.length;
            countryData[countryCode].responses.push(avgAnswer);
        }
    });

    // 计算每个国家的平均分数
    for (const countryCode in countryData) {
        const data = countryData[countryCode];
        if (data.responses.length > 0) {
            data.avgScore = data.responses.reduce((sum, val) => sum + val, 0) / data.responses.length;
        } else {
            data.avgScore = 0; // 如果没有有效的响应，平均分数设为 0
        }
    }

    // 收集所有国家的平均分数并排序
    const countryCodes = Object.keys(countryData);
    const avgScores = countryCodes.map(code => ({
        code,
        avgScore: countryData[code].avgScore,
    }));

    avgScores.sort((a, b) => a.avgScore - b.avgScore);

    // 将国家分为数量大致相等的三组（低、中、高）
    const totalCountries = avgScores.length;
    const groupSize = Math.ceil(totalCountries / 3);

    const lowGroup = avgScores.slice(0, groupSize).map(d => d.code);
    const mediumGroup = avgScores.slice(groupSize, groupSize * 2).map(d => d.code);
    const highGroup = avgScores.slice(groupSize * 2).map(d => d.code);

    // 为每个国家分配分数等级（0=低，1=中，2=高）
    for (const countryCode in countryData) {
        let scoreLevelIndex;
        if (lowGroup.includes(countryCode)) {
            scoreLevelIndex = 0; // 低
        } else if (mediumGroup.includes(countryCode)) {
            scoreLevelIndex = 1; // 中
        } else if (highGroup.includes(countryCode)) {
            scoreLevelIndex = 2; // 高
        }
        countryData[countryCode].scoreLevelIndex = scoreLevelIndex;
    }

    // 获取所有独特的文化区域并分配索引
    const culturalRegions = Array.from(culturalRegionsSet);
    const culturalRegionIndices = {};
    culturalRegions.forEach((region, index) => {
        culturalRegionIndices[region] = index;
    });

    return { countryData, culturalRegions, culturalRegionIndices };
}
