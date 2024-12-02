import { Icon } from 'antd';

interface IProps {
  isVis: boolean;
  onChange: (isVis: boolean) => void;
}

export default (props: IProps) => {

  const { isVis, onChange } = props;

  return (
    <Icon 
      type={isVis ? "table" : "pie-chart"} 
      title={isVis ? "normal mode" : "visualization mode"}
      onClick={() => onChange(!isVis)}
    />
  )
}