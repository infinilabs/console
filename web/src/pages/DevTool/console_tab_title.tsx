import {useState, useRef, useEffect} from 'react';
import './console_tab_title.scss';
import ElasticSvg from '@/assets/elasticsearch.svg'; 
import {Icon} from 'antd';

const ElasticIcon = () => (
  <img height="14px" width="14px" src={ElasticSvg} />
);

interface TabTitleProps {
  title: string,
  onTitleChange?: (title: string)=>void;
}

export const TabTitle = ({title, onTitleChange}: TabTitleProps)=>{
  const [editable, setEditable] = useState(false);
  const [value, setValue] = useState(title);
  const onValueChange = (e: any)=>{
    const newVal = e.target.value;
    setValue(newVal);
    if(typeof onTitleChange == 'function') onTitleChange(newVal);
  }
  useEffect(()=>{
    if(editable){
      inputRef.current?.focus();
    }
  },[editable])
  const inputRef = useRef(null);
  return (<div title="double click to change title" className="tab-title" onDoubleClick={()=>{
    setEditable(true)
  }}>
      {editable ? <input ref={inputRef} className="input-eidtor" 
      type="text" value={value} 
      onBlur={()=>{
        setEditable(false)
      }}
      onChange={onValueChange}/>:
      <div style={{display:'flex', alignItems:'center'}}><Icon component={ElasticIcon} />{value}</div>}
    </div>)
}

