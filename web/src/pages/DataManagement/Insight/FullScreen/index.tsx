import { Icon } from 'antd';

interface IProps {
  isVis: boolean;
  onFullScreen: () => void;
}

export default (props: IProps) => {

  const { onFullScreen } = props;

  return (
    <Icon 
      type="fullscreen" 
      title="full screen"
      onClick={onFullScreen}
    />
  )
}