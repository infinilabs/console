import DataSet from '@antv/data-set';
import moment from 'moment';

export const formatFloat = (value, pos = 2) => {
    return Math.round(value * Math.pow(10, pos)) / Math.pow(10, pos);
}

export const formatValue = (data, pos = 2) => {
    if (!data) return [];
    return data.map((item) => ({
        ...item,
        value: Number.isInteger(item.value) ? item.value : formatFloat(item.value, pos)
    })).sort((a, b) => a.timestamp - b.timestamp)
}

export const formatTime = (timestamp, format = "HH:mm") => {
    return moment.unix(timestamp / 1000).format(format)
}

export const findMaxUnit = (data) => {
    const max = Math.max(...data.map((item) => item.value))
    if ((max / 10000000) > 1) {
        return { factor: 10000000, unit: 'kw'}
    } else if ((max / 10000) > 1) {
        return { factor: 10000, unit: 'w'}
    } else if ((max / 1000) > 1) {
        return { factor: 1000, unit: 'k'}
    } else {
        return undefined
    }
}

export const UNIT_BIT = 'BIT'
export const UNIT_BYTES = 'B'
export const UNIT_KB = 'KB'
export const UNIT_MB = 'MB'
export const UNIT_GB = 'GB'
export const UNIT_TB = 'TB'
export const UNIT_PB = 'PB'
const UNIT_BIT_B_FACTOR = 8;
const UNIT_FACTOR = 1024;

const UNIT_SIZES = [UNIT_BYTES, UNIT_KB, UNIT_MB, UNIT_GB, UNIT_TB, UNIT_PB];

export const formatUnitToUnit = (value, fromUnit, toUnit) => {
    if (!value) return 0;
    if (value === 'None') return '---'
    const UNIT_BIT_B_FACTOR = 8;
    const isFromBit = fromUnit === UNIT_BIT;
    const isToBit = fromUnit === UNIT_BIT;
    let newValue = isFromBit ? value / UNIT_BIT_B_FACTOR : value;
    const newFromUnit = isFromBit ? UNIT_BYTES : fromUnit;
    const newToUnit = isToBit ? UNIT_BYTES : toUnit;
    const fromIndex = UNIT_SIZES.indexOf(newFromUnit);
    const toIndex = UNIT_SIZES.indexOf(newToUnit);
    if (fromIndex !== -1 && toIndex !== -1) {
        const pow = Math.pow(UNIT_FACTOR, Math.abs(toIndex - fromIndex))
        if (fromIndex <= toIndex) {
            newValue = newValue / pow;
        } else {
            newValue = newValue * pow
        }
    }
    if (isToBit) newValue = newValue * UNIT_BIT_B_FACTOR;
    return newValue
}

export const findBytesUnit = (value) => {
    return UNIT_SIZES[Math.floor(Math.log(value) / Math.log(UNIT_FACTOR))];
}

export const findDataMaxUnit = (data) => {
    if (!data || data.length === 0) return ''
    const max = Math.max(...data.map((item) => item.value));
    return findBytesUnit(max)
}

export const autoFormatUnitForBytes = (data) => {
    if (!data || data.length === 0) return {
        data: [],
        unit: UNIT_BYTES
    }
    const unit = findDataMaxUnit(data);
    return {
        data: formatValue(data.map((item) => ({
            ...item,
            value: formatUnitToUnit(item.value, UNIT_BYTES, unit)
        })), 2),
        unit 
    }
}

export const formatPercentData = (data) => {
    return {
        data: formatValue(data.map((item) => ({
            ...item,
            value: item.value
        })), 2),
        unit: '%'
    }
}

export function findMaxNumberUnit(value) {
    const newValue = {};
    // 千以内
    if (value < 1000) {
        return {
            factor: 1,
        }
    }
    // 百万以内 K
    if (value < 1000000) {
        return {
            factor: 1000,
            unit: 'K',
        }
    }
    // 十亿以内 M
    if (value < 1000000000) {
        return {
            factor: 1000000,
            unit: 'M',
        }
    }
    // 十亿以上 B
    if (value >= 1000000000) {
        return {
            factor: 1000000000,
            unit: 'B',
        }
    }
    return {
        factor: 1,
    };
}

export const formatNumberData = (data) => {
    if (!data || data.length === 0) return {
        data: [],
    }
    const max = Math.max(...data.map((item) => item.value));
    const maxNumberUnit = findMaxNumberUnit(max);
    return {
        data: formatValue(data.map((item) => ({
            ...item,
            value: item.value/ maxNumberUnit.factor
        })), 2),
        unit: maxNumberUnit.unit
    }
}