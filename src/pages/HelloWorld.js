export default () => {
    QRCode.toDataURL('some text', { version: 2 }, function (err, url) {
  console.log(url)
})


    return <div>hello 极限科技</div>;
}
