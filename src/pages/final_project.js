// Gender.js
import React from "react";
import 'bootstrap/dist/css/bootstrap.css'
import { csv, json } from "d3";
import { Row, Col, Container, Dropdown } from "react-bootstrap";
import styles from "../styles/final_proj.module.css";
import { GeoMap } from "../components/geoMap";
import { PieChart } from "../components/PieChart";
import { BarChart } from "../components/BarChart";
import Tooltip from "../components/Tooltip";
import { processCountryData } from "../components/dataProcessing";

const csvUrl = '/ivdata_1126.csv'
const jsonUrl = 'https://gist.githubusercontent.com/hogwild/26558c07f9e4e89306f864412fbdba1d/raw/5458902712c01c79f36dc28db33e345ee71487eb/countries.geo.json';

function useData() {
    const [data, setData] = React.useState(null);
    React.useEffect(() => {
        csv(csvUrl).then(data => {
            setData(data.map(row => ({
                B_COUNTRY_ALPHA: row.B_COUNTRY_ALPHA,
                Q28: +row.Q28,
                Q29: +row.Q29,
                Q30: +row.Q30,
                Q31: +row.Q31,
                Q32: +row.Q32,
                Q260: +row.Q260,
                cultural_region: row.cultural_region,
                age: row.Q262
            })));
        });
    }, []);
    return data;
}

function useMap() {
    const [countries, setCountries] = React.useState(null);
    React.useEffect(() => {
        json(jsonUrl).then(setCountries);
    }, []);
    return countries;
}

function computeAverageResponses(data) {
    if (!data || data.length === 0) return [];

    let agreeCount = 0;
    let totalCount = 0;

    data.forEach(d => {
        const answers = [d.Q28, d.Q29, d.Q30, d.Q31, d.Q32];
        answers.forEach(answer => {
            if (answer !== null && answer !== undefined) {
                totalCount += 1;
                if (answer === 1) {
                    agreeCount += 1;
                }
            }
        });
    });

    if (totalCount === 0) {
        return []; // 没有有效回答，返回空数组
    }

    const agreePercentage = (agreeCount / totalCount) * 100;
    const disagreePercentage = 100 - agreePercentage;

    return [
        { label: "Agree", value: agreePercentage },
        { label: "Disagree", value: disagreePercentage }
    ];
}

function computeResponsePercentages(data) {
    const questions = ["Q28", "Q29", "Q30", "Q31", "Q32"];
    const result = questions.map(question => {
    const totalResponses = data.length;
    const agreedResponses = data.filter(d => d[question] === 1).length;
    const disagreedResponses = data.filter(d => d[question] === 2).length;
    const agreePercentage = (agreedResponses / totalResponses) * 100;
    const disagreePercentage = 100 - agreePercentage;
    return {
            question: question,
            agreePercentage: agreePercentage,
            disagreePercentage: disagreePercentage,
            agreedResponses: agreedResponses,
            disagreedResponses: disagreedResponses,
            totalResponses: totalResponses
        };
    });

    return result;
}


function Gender(){
    const [age, setAge] = React.useState('6');
    const [selectedCountry, setSelectedCountry] = React.useState(null);
    const [selectedRegion, setSelectedRegion] = React.useState(null);
    const [selectedCountryName, setSelectedCountryName] = React.useState(null);
    const [selectedRegionName, setSelectedRegionName] = React.useState(null);
    const [selectedGender, setSelectedGender] = React.useState('all');


    // Tooltip 状态
    const [tooltipData, setTooltipData] = React.useState(null);
    const [isClickActive, setIsClickActive] = React.useState(false);

    const data = useData(csvUrl);
    const countries = useMap();
    const Age = [
        { min: 0, max: 20 },
        { min: 20, max: 30 },
        { min: 30, max: 40 },
        { min: 40, max: 50 },
        { min: 50, max: 60 },
        { min: 60, max: 103 },
    ];
    const defaultAge = { min: 0, max: 103 };
    const changeHandler = (event) => {
        setAge(Number(event.target.value));
    };
    
    const resetHandler = () => {
        setAge(Age.length);
    };

    const selectedRange = age < Age.length ? Age[age] : defaultAge;

    const personal_info = data
        ? (age < Age.length
            ? data.filter(d => d.age >= selectedRange.min && d.age < selectedRange.max)
            : data) // 如果 age=Age.length，则使用全部数据
        : [];
    const filteredData = React.useMemo(() => {
        if (selectedGender === 'all') {
            return personal_info;
        } else if (selectedGender === 'male') {
            return personal_info.filter(d => d.Q260 === 1);
        } else if (selectedGender === 'female') {
            return personal_info.filter(d => d.Q260 === 2);
        }
        return personal_info;
    }, [personal_info, selectedGender]);

    // 获取处理后的数据
    const defaultPieData = computeAverageResponses(filteredData);
    const { countryData } = processCountryData(filteredData);
    const defaultBarData = computeResponsePercentages(filteredData);

    if (!countries || !filteredData) {
        return <pre>Loading...</pre>;
    }

    const handleGenderChange = (gender) => {
        setSelectedGender(gender);
        // 重置选中的国家和区域
        setSelectedCountry(null);
        setSelectedRegion(null);
        setSelectedCountryName(null);
        setSelectedRegionName(null);
        setTooltipData(null);
        setIsClickActive(false);
    };
    

    const handleCountryClick = (countryCode, countryName, position) => {
        const data = countryData[countryCode];
        if (!data) {
            setTooltipData(null);
            setIsClickActive(false);
            return;
        }
        if (!countryCode || !personal_info.some(d => d.B_COUNTRY_ALPHA === countryCode)) {
            setSelectedCountry(null);
            setSelectedRegion(null);
            setSelectedCountryName(null);
            setSelectedRegionName(null);
            return;
        }
        // 检查当前显示的 Tooltip 是否属于同一个国家
        if (tooltipData && tooltipData.countryCode === countryCode) {
            setSelectedCountry(null);
            setSelectedRegion(null);
            setSelectedCountryName(null);
            setSelectedRegionName(null);
            // 如果是同一个国家，隐藏 Tooltip
            setTooltipData(null);
            setIsClickActive(false);
            return;
        }

        // 获取受访人数
        const respondentCount = filteredData.filter(d => d.B_COUNTRY_ALPHA === countryCode).length;

        // 获取平均分数
        const averageScore = data.avgScore;

        // 获取分数等级
        let groupLevel = '';
        if (data.scoreLevelIndex === 0) {
            groupLevel = 'Low';
        } else if (data.scoreLevelIndex === 1) {
            groupLevel = 'Medium';
        } else if (data.scoreLevelIndex === 2) {
            groupLevel = 'High';
        }

        setTooltipData({
            countryCode, // 添加 countryCode，用于比较
            countryName,
            respondentCount,
            groupLevel,
            averageScore,
            position
        });
        const countryDataItem = filteredData.find(d => d.B_COUNTRY_ALPHA === countryCode);
        setSelectedCountry(countryCode);
        setSelectedRegion(countryDataItem?.cultural_region);
        setSelectedCountryName(countryName);
        setSelectedRegionName(countryDataItem?.cultural_region);
        setIsClickActive(true);
    };
    
    const handleCountryHover = (countryCode, countryName) => {
        if (isClickActive) {
            return;
        }
    
        if (countryCode) {
            const countryDataItem = filteredData.find(d => d.B_COUNTRY_ALPHA === countryCode);
            
            setSelectedCountry(countryCode);
            setSelectedRegion(countryDataItem?.cultural_region);
            setSelectedCountryName(countryName);  // Use the countryName passed in as a parameter
            setSelectedRegionName(countryDataItem?.cultural_region);
        }
        else {
            setSelectedCountry(null);
            setSelectedRegion(null);
            setSelectedCountryName(null);
            setSelectedRegionName(null);
        }
    
        // Reset selected values if countryCode is not valid or not in personal_info
        if (!countryCode || !personal_info.some(d => d.B_COUNTRY_ALPHA === countryCode)) {
            setSelectedCountry(null);
            setSelectedRegion(null);
            setSelectedCountryName(null);
            setSelectedRegionName(null);
            return;
        }
    };

    // 关闭 Tooltip 的函数，当点击地图空白处时调用
    const handleMapClick = (event) => {
        if (event.target.tagName === 'svg') {
            setTooltipData(null);
            setSelectedCountry(null);
            setSelectedRegion(null);
            setSelectedCountryName(null);
            setSelectedRegionName(null);
            setIsClickActive(false);
        }
    };

    const maxVal = Age.length; // age=6时表示 All Ages
    const fraction = age / maxVal; // 当 age=6 时 fraction=1，全覆盖
    const sliderBackground = `linear-gradient(to right, #6e2c00 0%, #6e2c00 ${fraction * 100}%, #ccc ${fraction * 100}%, #ccc 100%)`;

    return (
        <Container fluid className={styles.body}>
            <div className={styles.headerContainer}>
                <div className={styles.globalHeader}>
                    <span className={styles.headerLarge}>Hello there</span><br />
                    <span className={styles.headerSmall}>Let&apos;s take a look at what the perspective is the Global Perspective of Gender Equality today</span>
                </div>
                <div className={styles.genderButtonContainer}>
                    <Dropdown>
                        <Dropdown.Toggle className={styles.genderButton}>
                            {selectedGender === 'all' ? 'All Genders' : selectedGender === 'male' ? 'Male' : 'Female'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleGenderChange('all')}>All</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleGenderChange('male')}>Male</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleGenderChange('female')}>Female</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
            <Col lg={3} md={2} className={styles.ageFilterContainer}>
                <div className={styles.sliderLine}>
                    <input
                        type="range"
                        min="0"
                        max={Age.length}
                        value={age}
                        step="1"
                        onChange={changeHandler}
                        list="age-ticks"
                        className={styles.ageSlider}
                        style={{ background: sliderBackground }}
                    />
                    <datalist id="age-ticks">
                        {Age.map((range, index) => (
                            <option key={index} value={index} label={`Age ${range.min}-${range.max}`} />
                        ))}
                        <option value={Age.length} label="All Ages" />
                    </datalist>
                    <span className={styles.ageButton}>
                        {age < Age.length ? `Age ${selectedRange.min}-${selectedRange.max}` : "All Ages"}
                    </span>
                </div>
                <button className={styles.resetButton} onClick={resetHandler}>Reset</button>
            </Col>

            <Row className={styles.row}>
                <Col md={7} onClick={handleMapClick}>
                    <div className={`${styles.card} ${styles.mapContainer}`}>
                    <div className={styles.cardHeader}>World Map</div>
                    
                    <GeoMap
                            width={755}
                            height={570}
                            countries={countries}
                            personal_info={filteredData}
                            onCountryHover={handleCountryHover}
                            onCountryClick={handleCountryClick}
                        />
                        {tooltipData && (
                            <Tooltip
                                countryName={tooltipData.countryName}
                                respondentCount={tooltipData.respondentCount}
                                groupLevel={tooltipData.groupLevel}
                                averageScore={tooltipData.averageScore}
                                position={tooltipData.position}
                            />
                        )}
                    </div>
                </Col>
                <Col md={5}>
                    <div className={`${styles.card} ${styles.introContainer}`}>
                        <div className={styles.cardHeader}>Project Introduction and Key Questions</div>
                        <div className={styles.cardBody}>
                            <p>Welcome to our interactive dashboard on the Gender Equity on Global Perspective. Our dashboard visualizes the World Values Survey (WVS) dataset to explore global perceptions of women&apos;s roles in family, politics, education, and business. By focusing on five key questions, we aim to uncover biases and track progress toward gender equality.
                            </p>
                            <ul>
                                <li>Q28: When a mother works for pay, the children suffer.</li>
                                <li>Q29: Men make better political leaders than women do, generally.</li>
                                <li>Q30: A university education is more important for a boy than for a girl.</li>
                                <li>Q31: Men make better business executives than women, generally.</li>
                                <li>Q32: Being a housewife is just as fulfilling as working for pay.</li>
                            </ul>
                            <p>Notes: 
                                <li>Since the logic of Q32 is opposite to that of other questions, we have swapped the data for Q32.</li>
                                <li>The Disagree option represents a higher status for women.</li></p>
                        </div>
                    </div>
                </Col>
            </Row>
            <Row className={styles.row}>
                <Col md={7}>
                    <div className={`${styles.card} ${styles.pieContainer}`}>
                        <PieChart
                            data={selectedCountry ? computeAverageResponses(filteredData.filter(d => d.B_COUNTRY_ALPHA === selectedCountry)) : defaultPieData}
                            title={selectedCountryName ? `${selectedCountryName} Responses` : "Global Responses"}
                        />
                    </div>
                    <div className={`${styles.card} ${styles.pieContainer}`}>
                    <PieChart
                            data={selectedRegion ? computeAverageResponses(filteredData.filter(d => d.cultural_region === selectedRegion)) : defaultPieData}
                            title={selectedRegionName ? `${selectedRegionName} Responses` : "Global Responses"}
                        />
                    </div>
                </Col>
                <Col md={5}>
                <div className={`${styles.card} ${styles.barContainer}`}>
                    <BarChart
                        data={selectedRegion ? computeResponsePercentages(filteredData.filter(d => d.cultural_region === selectedRegion)) : defaultBarData}
                        title={selectedCountryName ? `${selectedCountryName} Responses For Each Question` : "Global Responses"}
                    />
                </div>
                </Col>
            </Row>
        </Container>
    );
}
export default Gender;