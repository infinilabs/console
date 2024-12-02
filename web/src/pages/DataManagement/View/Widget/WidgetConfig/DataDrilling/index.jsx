import { Form, Input, Switch } from 'antd';
import styles from '../index.less';
import { formatMessage } from "umi/locale";
import { FORM_ITEM_LAYOUT } from '..';

export default (props) => {

    const { form, record, type } = props;
    
    const { getFieldDecorator } = form;

    const { title, formatter, order, size, drilling = {} } = record;

    return (
        <Form className={styles.form} {...FORM_ITEM_LAYOUT} colon={false}>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.data.drilling.url"})}>
                {getFieldDecorator("drilling.url", {
                    initialValue: drilling.url,
                })(<Input />)}
            </Form.Item>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.data.drilling.new.tab"})}>
                {getFieldDecorator('drilling.new_tab_switch', { 
                    valuePropName: 'checked',
                    initialValue: drilling.new_tab_switch, 
                })(<Switch size='small'/>)}
            </Form.Item>
        </Form>
    )
}