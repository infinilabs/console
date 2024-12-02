import { Icon, message } from "antd";
import { CopyToClipboard } from 'react-copy-to-clipboard';

export default (props) => {

    const { text } = props;

    return (
        <CopyToClipboard
            text={text}
            onCopy={() => message.success('Copy succeed!')}
        >
            <Icon type="copy" style={{ color: '#1890ff' }} onClick={(e) => e.stopPropagation()}/>
        </CopyToClipboard>
    )
}