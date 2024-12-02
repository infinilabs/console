import { Form } from "antd";
import { formatMessage } from "umi/locale";
import styles from "./index.less";
import DataSource from "./DataSource";

export default (props) => {

    const { form, record, globalQueries, customQueries, clusterList } = props;
    const { getFieldDecorator } = form;

    return (
        <>
            <Form.Item label={formatMessage({id: "dashboard.widget.config.data.source"})}>
                <DataSource
                    globalQueries={globalQueries}
                    customQueries={customQueries}
                    clusterList={clusterList}
                />
            </Form.Item>
        </>
    )
}