export default () => {
    var md5 = require('md5');
    console.log(md5('message'));
    
    var QRCode = require('qrcode')
    QRCode.toDataURL('some text', { version: 2 }, function (err, url) {
  console.log(url)
})


    return <div>hello 极限科技</div>;
}
