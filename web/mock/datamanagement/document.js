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
  // 'post /_search-center/doc/:index': function(req, res){
  //   switch(req.body.action){
  //     case 'SAVE':
  //       res.send({
  //         errno: "0",
  //         errmsg: ""
  //       });
  //       break;
  //     case 'ADD':
  //       res.send({
  //         errno: "0",
  //         errmsg: "",
  //         payload: {
  //           ...req.body.payload,
  //           id: getUUID(),
  //         }
  //       });
  //       break;
  //     case 'DELETE':
  //       res.send({
  //         errno: "0"
  //       });
  //       break;
  //     default:
  //       res.send(queryData)
  //   }
  // },
  // 'get /_search-center/indices/_cat': function(req, res){
  //   res.send({
  //     errno: "0",
  //     payload: ["infini-test"],
  //   });
  // }
}