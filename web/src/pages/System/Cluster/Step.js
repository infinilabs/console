import { Steps, Button, message } from 'antd';
import {connect} from "dva";
import { useState, useRef } from 'react';
import InitialStep from './steps/initial_step';

const { Step } = Steps;

const steps = [
  {
    title: '初始化',
  },
  {
    title: '连接',
    content: 'Second-content',
  },
  {
    title: '完成',
    content: 'Last-content',
  },
];

const ClusterStep = ({
  current,
  changeStep,
}) => {
  const initalFormRef = useRef();

  const next = async () => {
    let result
    if(current === 0){
      result = await initalFormRef.current.validateFields((errors, values) => {
        if(errors){
          return false;
        }
        console.log(values)
      }).catch((err)=>{
        return false;
      })
    }
    if(!result){
      return
    }
    changeStep(current + 1)
  };

  const prev = () => {
    changeStep(current - 1)
  };

  const renderContent = (current)=>{
    if(current===0){
      return <InitialStep ref={initalFormRef} />
    }else if(current === 1){
      return <></>
    }else{
      return null
    }
  }

  return (
    <>
      <Steps current={current}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <div className="steps-content">{renderContent(current)}</div>
      <div className="steps-action" style={{textAlign:'center'}}>
        {current < steps.length - 1 && (
          <Button type="primary" onClick={() => next()}>
            下一步
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button type="primary" onClick={() => message.success('Processing complete!')}>
            完成
          </Button>
        )}
        {current > 0 && (
          <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
            上一步
          </Button>
        )}
      </div>
    </>
  );
};

const NewCluster = ()=>{
  const [current, setCurrent] = useState(0);
  return <ClusterStep current={current} changeStep={setCurrent} />
}

export default connect(({
  clusterConfig
})=>({
  clusterConfig
}))(NewCluster)