import { Button, Form, Icon, Input, Result, Steps, Switch } from 'antd';
import styles from './index.less'
import { useState } from 'react';
import Configuration from './components/Configuration';
import Initialization from './components/Initialization';
import Settings from './components/Settings';
import Finish from './components/Finish';
import { formatMessage } from "umi/locale";

const { Step } = Steps;

const steps = [
    {
        title: formatMessage({ id: 'guide.initialization.step.configuration'}),
        desc: formatMessage({ id: 'guide.initialization.step.configuration.desc'}),
        component: Configuration,
    },
    {
        title: formatMessage({ id: 'guide.initialization.step.initialization'}),
        desc: formatMessage({ id: 'guide.initialization.step.initialization.desc'}),
        component: Initialization,
    },
    {
        title: formatMessage({ id: 'guide.initialization.step.settings'}),
        desc: formatMessage({ id: 'guide.initialization.step.settings.desc'}),
        component: Settings,
    },
    {
        title: formatMessage({ id: 'guide.initialization.step.finish'}),
        desc: formatMessage({ id: 'guide.initialization.step.finish.desc'}),
        component: Finish,
    }
]

export default Form.create()(({ form }) => {

    const [current, setCurrent] = useState(0);

    const [formData, setFormData] = useState({});

    const step = steps[current];

    const onPrev = () => {
        if (current > 0) {
            setCurrent(current - 1)
        }
    }

    const onNext = () => {
        if (current < steps.length) {
            setCurrent(current + 1)
        }
    }

    const onFormDataChange = (newData) => {
        setFormData({
            ...formData,
            ...newData
        })
    }

    return (
        <div className={styles.container}>
            <div className={styles.box}>
                <Steps current={current}>
                    {
                        steps.map((item, index) => (
                            <Step key={index} title={item.title}/>
                        ))
                    }
                </Steps>
                <div className={styles.stepsContent}>
                    {
                        step && (
                            <>
                                <div className={styles.desc}>
                                    {step.desc}
                                </div>
                                {
                                    step.component &&  (
                                        <div className={styles.content}>
                                            <step.component 
                                                form={form} 
                                                formData={formData}
                                                onPrev={onPrev} 
                                                onNext={onNext} 
                                                onFormDataChange={onFormDataChange}
                                            />
                                        </div>
                                    )
                                }
                            </>
                        )
                    }
                </div>
            </div>
        </div>
    )
})