import { EuiComboBox, EuiFormRow } from "@elastic/eui"

export default (props) => {
    const { indexPattern, spec, onChange } = props;
    const keys = Object.keys(spec?.function || {})
    const statistic = keys[0]
    const func = spec?.function?.[statistic]
    const { divisor, dividend } = func || {}

    return (
        <>
            <EuiFormRow label={'Dividend Field'} >
                <EuiComboBox
                    singleSelection
                    options={indexPattern.fields?.filter((item) => !!item.spec?.name).map((item) => (
                        { value: item.spec?.name, label: item.spec?.name }
                    ))}
                    selectedOptions={dividend ? [{ value: dividend, label: dividend }] : []}
                    onChange={(value) => {
                        onChange({ [statistic]: { 
                            ...(func || {}),
                            dividend: value[0]?.value 
                        }})
                    }}
                    isClearable={false}
                />
            </EuiFormRow>
            <EuiFormRow label={'Divisor Field'} >
                <EuiComboBox
                    singleSelection
                    options={indexPattern.fields?.filter((item) => !!item.spec?.name).map((item) => (
                        { value: item.spec?.name, label: item.spec?.name }
                    ))}
                    selectedOptions={divisor ? [{ value: divisor, label: divisor }] : []}
                    onChange={(value) => {
                        onChange({ [statistic]: { 
                            ...(func || {}),
                            divisor: value[0]?.value 
                        }})
                    }}
                    isClearable={false}
                />
            </EuiFormRow>
        </>
    )
}