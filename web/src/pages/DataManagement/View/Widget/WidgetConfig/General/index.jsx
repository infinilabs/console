import { Form, Input, Select } from 'antd';
import styles from '../index.less';
import { formatMessage } from "umi/locale";
import { useEffect, useMemo, useState } from 'react';
import { FORM_ITEM_LAYOUT } from '..';

export default (props) => {

    const { form, record, type, widgetPlugin } = props;
    
    const { getFieldDecorator } = form;

    const { title } = record;

    return (
        <Form className={styles.form} {...FORM_ITEM_LAYOUT} colon={false}>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.general.title"})}>
                {getFieldDecorator("title", {
                    initialValue: title,
                    rules: [
                        {
                            required: true,
                            message: "Please input widget title!",
                        },
                    ],
                })(<Input style={{ width: 'calc(100% - 24px)' }} />)}
            </Form.Item>
            {
                widgetPlugin?.generalConfig && (
                    <widgetPlugin.generalConfig 
                        form={form} 
                        record={record}
                    />
                )
            }
        </Form>
    )
}