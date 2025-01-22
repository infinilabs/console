import { EuiComboBox, EuiFormRow } from "@elastic/eui"
import { getStatistics } from ".";

export default (props) => {
    const { indexPattern, spec, onChange } = props;
    const keys = Object.keys(spec?.function || {})
    const statistic = keys[0]
    const func = spec?.function?.[statistic]
    const { field, group } = func || {}

    return (
        <>
            <EuiFormRow label={'Field'} >
                <EuiComboBox
                    singleSelection
                    options={indexPattern.fields?.filter((item) => !!item.spec?.name).map((item) => (
                        { value: item.spec?.name, label: item.spec?.name }
                    ))}
                    selectedOptions={field ? [{ value: field, label: field }] : []}
                    onChange={(value) => {
                        onChange({ [statistic]: { 
                            ...(func || {}),
                            field: value[0]?.value 
                        }})
                    }}
                    isClearable={false}
                />
            </EuiFormRow>
            <EuiFormRow label={'Group Field'} >
                <EuiComboBox
                    singleSelection
                    options={indexPattern.fields?.filter((item) => !!item.spec?.name).map((item) => (
                        { value: item.spec?.name, label: item.spec?.name, type: item.spec?.type }
                    ))}
                    selectedOptions={group?.field ? [{ value: group?.field, label: group?.field }] : []}
                    onChange={(value) => {
                        const types = getStatistics(value[0]?.type)
                        onChange({ [statistic]: { 
                            ...(func || {}),
                            group: {
                                field: value[0]?.value,
                                type: value[0]?.type,
                                func: types.includes('max') ? 'max' : types[0]
                            }
                        }})
                    }}
                    isClearable={false}
                />
            </EuiFormRow>
            {/* <EuiFormRow label={'Group Statistic'} >
                <EuiComboBox
                    singleSelection
                    options={getStatistics(group?.type).map((item) => (
                        { value: item, label: item.toUpperCase() }
                    ))}
                    selectedOptions={group?.func ? [{ value: group?.func, label: group?.func?.toUpperCase() }] : []}
                    onChange={(value) => {
                        onChange({ [statistic]: { 
                            ...(func || {}),
                            group: {
                                ...(group || {}),
                                func: value[0]?.value
                            }
                        }})
                    }}
                    isClearable={false}
                />
            </EuiFormRow> */}
        </>
    )
}