import { Icon, Popconfirm } from "antd"
import { useState } from "react"

export default (props) => {

    const { actionType, onCancel, onSave } = props;

    const [visible, setVisible] = useState(false);

    return (
        <>
          {
            actionType && (
              <Popconfirm
                  title={"Sure to cancel?"}
                  onConfirm={() => onCancel()}
                  placement="left"
              >
                <Icon 
                  type={"redo"} 
                  title="cancel" 
                />
              </Popconfirm>
            )
          }
          <Icon 
            type={actionType ? 'save' : 'edit'} 
            onClick={onSave}
            title={actionType ? 'save' : 'edit'}
          />
        </>
    )
}