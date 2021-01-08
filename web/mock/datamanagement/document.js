import {queryData} from './data/doc';

function getUUID(len){
  len = len || 20;
  let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var maxPos = chars.length;
　var uuid = '';
　for (let i = 0; i < len; i++) {
    uuid += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return uuid;
}

export default {
  'get /_search-center/doc/:index/_search': function(req, res){
    res.send(queryData)
  },
  'post /_search-center/doc/:index/_create': function(req, res){
    res.send({
      status: true,
      payload: {
        ...req.body.payload,
        id: getUUID(),
      }
    });
  },
  'put /_search-center/doc/:index/:id': function(req, res){
    res.send({
      status: true,
      payload: req.body
    });
  },

  'delete /_search-center/doc/:index/:id': function(req, res){
    res.send({
      status: true,
      payload: null,
    });
  }
}