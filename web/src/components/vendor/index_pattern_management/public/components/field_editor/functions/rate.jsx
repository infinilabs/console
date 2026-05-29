import { EuiComboBox, EuiFormRow } from "@elastic/eui"
import { formatMessage } from "umi/locale";

export default (props) => {
    const t = (id, defaultMessage) => formatMessage({ id, defaultMessage });
    const { indexPattern, spec, onChange } = props;
    const keys = Object.keys(spec?.function || {})
    const statistic = keys[0]
    const func = spec?.function?.[statistic]
    const { field, group } = func || {}

    return (
        <EuiFormRow label={t("explore.view.index_pattern.field_editor.field", "Field")} >
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
    )
}