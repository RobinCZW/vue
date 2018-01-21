import { getMIMEByName } from 'utils/mime'
const plugins = window.plugins
function b64 (text) {
  return window.btoa(unescape(encodeURIComponent(text)))
}
function genURL (title, text, url) {
  return `mqqapi://share/to_qqdataline?src_type=app&version=1&file_type=news&app_name=${b64(title)}&req_type=${b64('6')}&description=${b64(text)}`
  /*
  mqqapi://share/to_fri?
  src_type=app&
  version=1&
  file_type=news&
  title=5ZOI5ZOI5ZOI&
  description=5ZG15ZG15ZG1&
  share_id=222222&&
  url=aHR0cDovL2p3Y2guZnp1LmVkdS5jbi8=&
  app_name=5b6u5L+h&
  req_type=MQ==&
  cflag=MA==
  */
  // return `mqqapi://share/to_fri?src_type=app&version=1&file_type=news&cflag=${b64(0)}&share_id=2222222&title=${b64(title)}&app_name=${b64(title)}&req_type=${b64('1')}&description=${b64(text)}&url=${b64(url)}`
}
function checkPlugin () {
  return plugins && plugins.webintent
}
export function sendToMyCompouter (text, url) {
  if (!checkPlugin()) return
  let surl = genURL('期末考啦', text, url)
  console.log('openurl: ', surl)
  return plugins.webintent.startActivity({
    action: plugins.webintent.ACTION_VIEW,
    url: surl
  }, r => null, e => {
    throw new Error('启动QQ失败')
  })
}
export function openWithUrl (url) {
  let type = getMIMEByName(decodeURIComponent(url))
  // console.log(url, decodeURIComponent(url), type)
  plugins.webintent.startActivity({
    action: plugins.webintent.ACTION_VIEW,
    url: url,
    type
  }, r => null, e => {
    throw new Error('打开文件失败')
  })
}
// plugins.webintent.startActivity({action: plugins.webintent.ACTION_VIEW, url: sendToMyCompouter('http://finalexam.cn/1.txt')})
