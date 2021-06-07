import Console from '../../components/kibana/console/components/Console';
import {connect} from 'dva';

// export default ()=>{
//   return (
//     <Console />
//   )
// }


export default connect(({
  global
})=>({
  selectedCluster: global.selectedCluster,
}))(Console);