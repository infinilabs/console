import { Button, Form, Icon, Input, Popover, Select } from 'antd';
import React from 'react';
import styles from './index.less';

class SaveQueriesForm extends React.Component {
    state = {
        newTag: '',
        addTagVisible: false,
        isSaveAsDisabled: true
    };

    addTag = () => {
        const { tags, onTagsChange } = this.props;
        const { newTag } = this.state; 
        if (!tags.includes(newTag) && newTag.trim()) {
            onTagsChange([...tags, newTag]);
        }
        this.setState({ 
            addTagVisible: false,
            newTag: ''
        });
    };

    onSave = () => {
        const { form , record} = this.props;
        form.validateFieldsAndScroll((err, values) => {
            if (!err) {
                const { tags } = values
                this.props.onQueriesSave({
                    ...(record || {}), 
                    ...values,
                    tags: tags ? [tags] : []
                });
            }
        });
    }

    checkTitle = (rule, value, callback) => {
        const { form , data, record} = this.props;
        const { getFieldValue } = form
        if (!record?.id && value && data.findIndex((item) => item.title === value) !== -1) {
            callback('Changed title already exists!')
        }
        callback()
    }

    render() {
        const { record, tags, loading, form } = this.props;
        const { getFieldDecorator } = form;
        const { addTagVisible, newTag, isSaveAsDisabled } = this.state;
        
        return (
            <Form className={styles.form} colon={false}>
                <Form.Item label="Title">
                    {getFieldDecorator('title', {
                        initialValue: record?.title,
                        rules: [
                            {
                                required: true,
                                message: 'Please input title!',
                            },
                            {
                                validator: this.checkTitle
                            }
                        ],
                    })(<Input onChange={(e) => {
                        const { value } = e.target;
                        if (value !== record?.title) {
                            this.setState({ isSaveAsDisabled: false })
                        }
                    }}/>)}
                </Form.Item>
                <Form.Item 
                    label="Tag" 
                >
                    {getFieldDecorator('tags', {
                        initialValue: record?.tags?.[0],
                    })(
                        <Input />
                    )}
                </Form.Item>
                <Form.Item label="Description">
                    {getFieldDecorator('description', {
                        initialValue: record?.description,
                    })(<Input />)}
                </Form.Item>
                <Form.Item className={styles.actions}>
                    <Button>Cancel</Button>
                    <Button 
                        type='primary'
                        onClick={this.onSave}
                        loading={loading}
                    >
                        {record?.id ? 'Update' : 'Save'}
                    </Button>
                </Form.Item>
            </Form>
        )
    }
}

const WrappedSaveQueriesForm = Form.create()(SaveQueriesForm);

export default WrappedSaveQueriesForm