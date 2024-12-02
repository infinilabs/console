
import './tag.scss';
import * as React from 'react';

export const Tag = (props={})=>{

  const [checked, setChecked] = React.useState(props.checked)
  const toggleChecked = ()=>{
    if(typeof props.onChange == 'function'){
      props.onChange({
        checked: !checked,
        text: props.text,
      })
    }
    setChecked(!checked);
  }
  return (
    <div className={"tag" +(checked ? ' checked': '')} onClick={toggleChecked}>
      <div className="wrapper">
       <span className="text">{props.text}</span>
      </div> 
    </div>
  )
}

export const TagList = (props)=>{
  const [value, setValue] = React.useState(()=>{
    return (props.value||[]).filter(item=>item.checked == true)
  })
  const onTagChange = (citem)=>{
    const newVal = [...value]
    const idx = newVal.findIndex(item=>item.text == citem.text);
    if(idx > -1) {
      if(citem.checked == true){
        newVal[idx].checked = citem.checked;
      }else{
        newVal.splice(idx,1)
      } 
    }else{
      if(citem.checked == true){
       newVal.push(citem);
      }
    }
    if(typeof props.onChange == 'function'){
      props.onChange(newVal);
    }
    setValue(newVal); 
  } 
  return (
    <div className="tag-list">
      {(props.value||[]).map((item)=>{
        return <Tag key={item.text} {...item} onChange={onTagChange} />
      })}
    </div>
  )
}