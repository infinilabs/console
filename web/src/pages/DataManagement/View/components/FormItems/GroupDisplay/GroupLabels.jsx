import Group from "@/components/Icons/Group";
import GroupBy from "@/components/Icons/GroupBy";
import { getDocPathByLang, getWebsitePathByLang } from "@/utils/utils";
import { Button, Icon, Input, Switch } from "antd"
import { cloneDeep } from "lodash";
import { useMemo } from "react";
import { formatMessage } from "umi/locale";

export default (props) => {

    const { value = [], onChange, isMutiple, max = 0 } = props;

    const onAdd = () => {
        if (value.length >= 5) {
            return;
        }
        const newValue = cloneDeep(value);
        newValue.push({})
        onChange(newValue)
    }

    const onRemove = (index) => {
        const newValue = cloneDeep(value);
        newValue.splice(index, 1)
        onChange(newValue)
    }

    const onTemplateChange = (template, index) => {
        const newValue = cloneDeep(value);
        if (!newValue[index]) newValue[index] = {};
        newValue[index].template = template;
        onChange(newValue)
    }

    const onSwitchChange = (checked, index) => {
        const newValue = cloneDeep(value);
        if (!newValue[index]) newValue[index] = {};
        newValue[index].enabled = checked;
        onChange(newValue)
    }

    const showedItems = useMemo(() => {
        if (isMutiple) return value.slice(0, max);
        return value[0] ? [value[0]] : []
    }, [value, isMutiple, max]) 

    return (
        <>
            {
                showedItems.map((item, index) => (
                    <div style={{ marginBottom: 10 }}>
                        <Input.Group compact>
                            {index > 0 ? (
                                <span
                                    style={{
                                    fontSize: 18,
                                    width: 30,
                                    textAlign: "center",
                                        marginLeft: (index - 1) * 30,
                                    }}
                                >
                                    <Icon style={{ fontSize: 30, position: 'relative', left: 4, top: '-15px'}} component={Group} />
                                </span>
                            ) : null}
                            <Input
                                style={{
                                    width: 32,
                                    textAlign: "center",
                                    pointerEvents: "none",
                                    backgroundColor: "#fafafa",
                                    color: "rgba(0, 0, 0, 0.65)",
                                }}
                                defaultValue={index+1}
                                disabled
                            />
                            <div style={{ textAlign: 'center', lineHeight: '28px', width: 40, height: 32, backgroundColor: "#fafafa", border: '1px solid #d9d9d9'}}>
                                <Switch style={{ margin: 0 }} size="small" checked={item?.enabled || false} onChange={(checked) => onSwitchChange(checked, index)}/>
                            </div>
                            <div style={{
                                width: 100,
                                textAlign: "center",
                                backgroundColor: "#fafafa",
                                color: "rgba(0, 0, 0, 0.65)",
                                height: '32px',
                                lineHeight: '32px',
                                border: '1px solid #d9d9d9'
                            }}>
                                {formatMessage({ id: "dashboard.widget.config.group.labels.template" })} <a href={`${getDocPathByLang()}/reference/alerting/variables/`} target="_blank"><Icon type="question-circle" /></a>
                            </div>
                            <Input 
                                style={{ 
                                    width: `calc(100% - ${30 * index}px - 32px - 40px - 100px - 22px)`,
                                }}
                                value={item?.template}
                                onChange={(e) => onTemplateChange(e.target.value, index)}
                            />
                            <Icon style={{ margin: '0 0 0 6px', fontSize: 16, cursor: 'pointer', verticalAlign: '-8px' }} type="close-circle" onClick={() => onRemove(index)}/>
                        </Input.Group>
                    </div>
                ))
            }
            {
                (isMutiple || value.length === 0 ) && (
                    <Button
                        type="primary"
                        icon="plus"
                        onClick={onAdd}
                        size="small"
                        disabled={value.length >= max ? true : false}
                    >
                        {formatMessage({ id: "dashboard.widget.config.group.labels.add" })}
                    </Button>
                )
            }
        </>
    )
}