import { Heatmap } from "@ant-design/charts";
import { cloneDeep } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";
import * as uuid from 'uuid';
import { fixFormatter, generateColors, handleTextOverflow } from "./Chart";

function findMaxSize(a, b, n) {
    let c = Math.min(a, b);
    let rows, cols;  

    while (c >= 50) {
        cols = Math.floor(a / c);  
        rows = Math.floor(b / c);  
        if (cols * rows >= n) {  
            return { rows: rows, cols: cols, itemWidth: c };  
        }
        c-=0.01;  
    }
    cols = Math.floor(a / 50)
    rows = Math.ceil(n / cols)
    return { rows, cols, itemWidth: c };  
}

export default (props) => {
    const { config = {}, data = [] } = props
    const { 
        top,
        colors = [],
        sourceColor = {},
    } = config;

    const containerRef = useRef()
    const [size, setSize] = useState()

    const color = useMemo(() => {
        if (colors.length === 0 || !sourceColor?.key || data.length === 0) return undefined
        const newColors = generateColors(colors, data).reverse()
        if (newColors.length === 0) return undefined
        return (a, b, c) => {
            if (Number.isFinite(a?.value)) {
                const splits = `${a.value}`.split('2024')
                const value = Number(splits[1])
                const index = Number(splits[0])
                return newColors[index] || (value == 0 ? newColors[newColors.length - 1] : newColors[0])
            } else {
                return '#fff'
            }
        }
    }, [data, colors, sourceColor])

    const formatData = useMemo(() => {
        if (!data || data.length === 0 || !size?.cols) return [];
        const cols = size?.cols
        const newData = []
        let rowData = []
        data.forEach((item, index) => {
            if (rowData.length === cols) {
                newData.unshift(cloneDeep(rowData))
                rowData = []
            }
            rowData.push({
                item,
                name: item.name,
                col: `${index % cols}`,
                row: `${Math.floor(index / cols)}`,
                value: Number(`${index}2024${item.valueColor}`)
            })
        })
        if (rowData.length !== cols) {
            const size = cols - rowData.length
            for (let i=data.length; i<(data.length + size); i++) {
                rowData.push({
                    col: `${i % cols}`,
                    row: `${Math.floor(i / cols)}`,
                    value: null
                })
            }
        }
        newData.unshift(rowData)
        return [].concat.apply([], newData)
    }, [JSON.stringify(data), size?.cols])

    const handleResize = (size) => {
        if (containerRef.current) {
            const { offsetWidth, offsetHeight } = containerRef.current
            if (size === 1) {
                setSize({
                    rows: 1,
                    cols: 1,
                    itemWidth: offsetWidth,
                    width: '100%',
                    height: '100%'
                })
            } else {
                let { cols, rows, itemWidth } = findMaxSize(offsetWidth, offsetHeight, size)
                if (cols * itemWidth < offsetWidth) {
                    cols++
                    itemWidth = offsetWidth / cols
                    rows = Math.ceil(size / cols)
                }

                setSize({
                    rows,
                    cols,
                    itemWidth,
                    width: cols * itemWidth,
                    height: rows * itemWidth
                })
            }
        }
    }

    useEffect(() => {
        handleResize(data.length)
        const onResize = () => {
            handleResize(data.length)
        }
        window.addEventListener('resize', onResize)
        return () => {
            window.removeEventListener('resize', onResize)
        }
    }, [JSON.stringify(data)])

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <div style={{ width: size?.width, height: size?.height }}>
            <Heatmap {...{
                animation: false,
                data: formatData,
                xField: 'col',
                yField: 'row',
                colorField: 'value',
                shape: '',
                color,
                label: {
                    style: {
                        fill: '#fff',
                        shadowBlur: 2,
                        shadowColor: 'rgba(0, 0, 0, .45)',
                    },
                    formatter: (a, b, c) => {
                        return handleTextOverflow(a.name, size?.itemWidth)
                    }
                },
                heatmapStyle: {
                    lineWidth: 0
                },
                xAxis: {
                    tickLine: null,
                    label: null,
                },
                yAxis: {
                    tickLine: null,
                    label: null,
                },
                legend: false,
                tooltip: {
                    customContent: (title, items) => {
                    if (!items[0]) return;
                    const { color, data } = items[0];
                    const { item } = data;

                    if (item) {
                        const { format: formatColor, pattern: patternColor, unit: unitColor } = sourceColor || {}
                        const {  name, value, nameColor, valueColor, displayName } = item || {}
                        const formatterColor = fixFormatter(formatColor, patternColor)
                        const markers = []
                        markers.push({
                            name: nameColor,
                            value: formatterColor ? formatterColor(valueColor) : valueColor,
                            unit: unitColor,
                            marker: <span style={{ position: 'absolute', left: 0, top: 0, display: 'block', borderRadius: '2px', backgroundColor: color, width: 12, height: 12 }}></span>
                        })
                        return (
                            <div style={{ padding: 4 }}>
                            {
                                <h5 style={{ marginTop: 12, marginBottom: 12 }}>
                                {displayName}
                                </h5>
                            }
                            <div>
                                {
                                markers.map((item, index) => (
                                    <div
                                    style={{ display: 'block', paddingLeft: 18, marginBottom: 12, position: 'relative' }}
                                    key={index}
                                    >
                                    {item.marker}
                                    <span
                                        style={{ display: 'inline-flex', flex: 1, justifyContent: 'space-between' }}
                                    >
                                        <span style={{ marginRight: 16 }}>{item.name}:</span>
                                        <span className="g2-tooltip-list-item-value">
                                        {item.unit ? `${item.value}${item.unit}` : item.value}
                                        </span>
                                    </span>
                                    </div>
                                ))
                                }
                            </div>
                            </div>
                        );
                    } else {
                        return null
                    }
                    },
                }
            }} />
            <div style={{ float: 'right'}}></div>
            </div>
        </div>
    )
}