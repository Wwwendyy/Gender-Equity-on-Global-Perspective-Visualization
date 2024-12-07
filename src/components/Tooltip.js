// Tooltip.js
import React from 'react';
import styles from '../styles/Tooltip.module.css';

function Tooltip({ countryName, respondentCount, groupLevel, averageScore, position }) {
    const tooltipRef = React.useRef();

    React.useEffect(() => {
        if (!countryName) return;

        const tooltipElement = tooltipRef.current;
        if (tooltipElement) {
            const { offsetWidth, offsetHeight } = tooltipElement;
            let left = position.x + 10; // 向右偏移10像素，避免遮挡鼠标
            let top = position.y + 10;  // 向下偏移10像素

            // 检查右边界
            if (left + offsetWidth > window.innerWidth) {
                left = position.x - offsetWidth - 10;
            }

            // 检查下边界
            if (top + offsetHeight > window.innerHeight) {
                top = position.y - offsetHeight - 10;
            }

            // 检查左边界
            if (left < 0) {
                left = 10;
            }

            // 检查上边界
            if (top < 0) {
                top = 10;
            }

            tooltipElement.style.left = `${left}px`;
            tooltipElement.style.top = `${top}px`;
        }
    }, [position, countryName]);

    if (!countryName) {
        return null;
    }

    return (
        <div ref={tooltipRef} className={styles.tooltip}>
            <h4>{countryName}</h4>
            <p>Respondents: {respondentCount}</p>
            <p>Group Level: {groupLevel}</p>
            <p>Average Score: {averageScore.toFixed(2)}</p>
        </div>
    );
}

export default Tooltip;
