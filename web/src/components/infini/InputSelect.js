import React from 'react';
import {Input, Menu, Dropdown} from 'antd';

class InputSelect extends React.Component{
  componentDidMount(){
  }
  constructor(props){
   // console.log('new: '+ props.id)
    super(props);
    this.state = {
      value: props.defaultValue || props.value,
    }
  }

  onClick = ({ key }) => {
    this.setState({
      value: key,
    })
    this.triggerChange(key)
  }
  triggerChange = (val)=>{
    let {onChange} = this.props;
    if(onChange && typeof onChange == 'function'){
      onChange(val)
    }
  }
  handleChange = (ev) => {
    let val = ev.target.value;
    let filterData = this.props.data.slice();
    if(val != ""){
      filterData = filterData.filter(v=>v.value.includes(val))
    }
    this.setState({
      value: val,
      data: filterData
    })
   this.triggerChange(val);
  }
  render(){
    let {id, data, onChange, value, ...restProps} = this.props;
    let filterData = this.state.data || data || [];
    return (
        <Dropdown overlay={
          <Menu onClick={this.onClick} style={{maxHeight:'350px', overflow:"scroll"}}>
            {filterData.map(op =>(
              <Menu.Item key={op.value}>{op.label}</Menu.Item>
            ))}
          </Menu>
        } trigger={['focus']}>
          <Input id={id} {...restProps} value={this.state.value} autoComplete="off" onChange={this.handleChange}/>
        </Dropdown>
    )
  }
}

export default InputSelect;