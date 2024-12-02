import { Form, Icon } from "antd"
import styles from "../index.less";
import { formatMessage } from "umi/locale";
import { FORM_ITEM_LAYOUT } from "..";

export default (props) => {

    const { globalQueries, customQueries, widgetPlugin, record } = props;

    const currentClusterId = customQueries.cluster_id || globalQueries.cluster_id;
    const currentIndices = (customQueries.cluster_id ? customQueries.indices : globalQueries.indices) || [];

    return (
        <Form className={styles.form} {...FORM_ITEM_LAYOUT} colon={false}>
            {
                widgetPlugin?.sourceConfig && (
                    <widgetPlugin.sourceConfig 
                        {...props}
                        clusterId={currentClusterId}
                        indices={currentIndices}
                    />
                )
            }
        </Form>
    )
}