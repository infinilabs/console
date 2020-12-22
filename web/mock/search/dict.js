import { func } from "prop-types";

let dictList = [{
  name: '道路词汇大全',
  content: '晨明、作业段、作业标志、左开道岔、左港、遵义南、遵义北、俎上之肉、组合辙叉、阻工、走马岭、纵向间距、纵向轨枕、纵向标线、纵梁桥、纵断面高程、总监代表处、总监办、总概算汇总',
  tags: ['铁路']
},{
  name: '铁路词汇',
  content: '晨明、作业段、作业标志、左开道岔、左港、遵义南、遵义北、俎上之肉、组合辙叉、阻工、走马岭、纵向间距、纵向轨枕、纵向标线、纵梁桥、纵断面高程、总监代表处、总监办、总概算汇总',
  tags: ['铁路']
},{
  name: '中国国道省道高速公路名录',
  content: ''
},{
  name: '民用航空',
  content: ''
},{
  name: '铁路常用词',
  content: ''
},{
  name: '铁路词汇',
  content: ''
},{
  name: '铁路工务',
  content: ''
},];


export default {
  'post /search/dictlist': function(req, res){
    res.send(dictList);
  },
  // 'post /api/dict/_create': function(req, res){
    
  // }
}