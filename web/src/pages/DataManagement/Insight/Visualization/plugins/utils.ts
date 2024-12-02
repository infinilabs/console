export const findMaxUnit = (data: any) => {
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