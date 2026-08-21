import { EuiComboBox, EuiFormRow } from "@elastic/eui"
import { formatMessage } from "umi/locale";

export default (props) => {
    const t = (id, defaultMessage) => formatMessage({ id, defaultMessage });
    const { indexPattern, spec, onChange } = props;
    const keys = Object.keys(spec?.function || {})
    const statistic = keys[0]
    const func = spec?.function?.[statistic]
    const { divisor, dividend } = func || {}

    return (
        <>
            <EuiFormRow label={t("explore.view.index_pattern.field_editor.dividend_field", "Dividend Field")} >
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
            <EuiFormRow label={t("explore.view.index_pattern.field_editor.divisor_field", "Divisor Field")} >
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