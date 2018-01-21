import manifest from '../manifest'
import Vue from 'vue'
import VueResource from 'vue-resource'
import xsq from './xsq'
import DownloadManager from 'utils/download'
import { Toast, MessageBox } from 'mint-ui'
import {alipay} from './pay'

Vue.use(VueResource)

function https (url) {
  if (url.startsWith('http://')) {
    return `https://${url.substr(7)}`
  }
  return url
}

const urlRoot = 'http://finalexam.cn'// 'http://finalexam.cn' // 'http://192.168.31.169:8080'
const urlRootHttps = https(urlRoot)
const apiAdmin = urlRoot + '/api/admin';
const apiRoot = urlRoot + '/api';

var sessionId = localStorage.getItem('sessionId')
const customError = {
  '/user/modify': (response) => {
    if (response.status === 104) { // 参数错误
      const map = {
        nickname: '昵称已被占用',
        gender: '性别',
        AcademyId: '学院选择错误',
        password: '密码不符合规则',
        enterYear: '入学年份无效'
      }
      let text = ''
      for (let field of response.body.fields) {
        if (map[field]) {
          text += map[field] + ' '
        }
      }
      text += ', 请修改后重新提交'
      response.statusText = text
    }
  }
}
Vue.http.interceptors.push((request, next) => {
  // use session
  if (request.url.startsWith(urlRoot) || request.url.startsWith(urlRootHttps)) {
    if (sessionId !== null) {
      request.params['sessionId'] = sessionId
    }
    next(response => {
      let r = response.body
      if (response.status === 200) {
        response.body = r.res
        response.status = r.code
        response.statusText = r.info
        response.ok = r.code === 0
        if (!response.ok) {
          for (let patn of Object.keys(customError)) {
            if (request.url.indexOf(patn) !== -1) {
              customError[patn](response)
              break
            }
          }
        }
      } else {
        response.body = `${response.status} ${response.statusText}`
        response.status = -1
        response.statusText = '网络错误'
        response.ok = false
      }
    })
    return
  }
  next()
})

var services = new Vue({
  methods: {
    prepare () {
      let ret = Promise.resolve()
      // if (this.first) { // sessionId === null
      //   ret = ret.then(() => this.$http.post(apiRoot+'/session'))
      //     .then(apiRC, apiRC)
      //     .then(r => {
      //       sessionId = r.sessionId
      //       localStorage.setItem('sessionId', sessionId)
      //       this.first = false
      //     })
      // }
      return ret
    },
    wrapper (method) {
      let self = this
      return function () {
        return self.prepare()
          .then(() => method.apply(self, arguments))
          .then(apiRC, apiRC)
      }
    },
    initSession () {
      return this.$http.post(apiRoot+'/session')
        .then(apiRC, apiRC)
        .then(r => {
          console.log(r)
          sessionId = r.sessionId
          localStorage.setItem('sessionId', sessionId)
        })
    },
    initModules () {
      let all = []
      let dict = {}
      let initer = (group) => {
        let inited = false
        return Promise.resolve().then(() => {
          let chain = Promise.resolve()
          if (inited) return chain
          if (group.deps) {
            for (let d of group.deps) {
              chain = chain.then(() => dict[d])
            }
            chain = chain.then(() => {
              let deps = {}
              for (let d of group.deps) {
                deps[d] = this.$data[d]
              }
              return deps
            })
          }
          chain = chain.then(deps => {
            deps = deps || {}
            if (!inited) {
              return group.init.call(group, deps, this.store)
            }
          }).then(() => inited = true)
          return chain
        })
      }
      // 启动每个模块的init
      Object.keys(this.$data).forEach(key => {
        let group = this.$data[key]
        if (typeof group === 'object') {
          if (Object.keys(group).includes('init')) {
            dict[key] = initer(group)
          } else {
            dict[key] = () => null
          }
          all.push(dict[key])
        }
      })
      console.group('services')
      console.log('services init begin')
      return Promise.all(all).then(() => {
        console.log('services init done')
        console.groupEnd()
      })
      .catch(e => {
        console.log('services init err', e)
        console.groupEnd()
      })
    },
    init () {
      return this.initSession()
        .then(() => this.initModules())
    }
  },
  created () {
    try {
      let json = JSON.parse(localStorage.getItem('store'))
      for (let key of Object.keys(json)) {
        this.store[key] = json[key]
      }
    } catch (e) {}

    Object.keys(this.$data).forEach(key => {
      if (['utils'].includes(key)) return
      let group = this.$data[key]
      if (typeof group === 'object') {
        Object.keys(group).forEach(method => {
          if (!(['init'].includes(method)) && (typeof group[method] === 'function')) {
            group[method] = this.wrapper(group[method])
          }
        })
      }
    })
    //
    this.xsq = xsq.call(this, Vue.http, this.$http)
    this.download = DownloadManager
    // 启动更新now的interval
    setInterval(() => {
      this.utils.now = new Date()
    }, 1000)
  },
  watch: {
    store: {
      handler () {
        localStorage.setItem('store', JSON.stringify(this.store))
      },
      deep: true
    }
  },
  computed: {
    manifest () {
      return manifest
    }
  },
  data: {
    first: true, // 启动时第一次判断
    config: {
      disableRipple: true,
      statusBarHeight: 0
    },
    store: { // 不使用子对象
      username: '',
      password: '',
      user: {},
      topList: [],
      orderform: {
        name: '',
        addr: '',
        phone: ''
      }
    },
    global: { // TODO: ugly
      curFeed: {}
    },
    xsq: {},
    download: {},
    utils: {
      delay (i) {
        return function () {
          return new Promise((res, rej) => setTimeout(() => res.apply(null, arguments), i));
        }
      },
      toast (message, duration = 3000) {
        Toast({
          message: message,
          position: 'middle',
          duration: duration
        });
      },
      prompt (message) {
        return MessageBox.prompt(message)
      },
      MessageBox: MessageBox,
      now: new Date()
    },
    review: {
      list () {
        return this.$http.post(apiAdmin+'/review/list')
      }
    },
    sms: {
      send (phone = null) {
        return this.$http.post(apiRoot+`/sms/send`, {phone})
      },
      trusted () {
        return this.$http.post(apiRoot+`/sms/trusted`)
      },
      verify (code) {
        return this.$http.post(apiRoot+`/sms/verify`, {code})
      }
    },
    dbfs: {
      getDownloadUrl (school, path) {
        // return apiRoot+`/dbfs/${school}/download?path=`+encodeURI(path);
        return this.$http.post(apiRoot+`/dbfs/${school}/downloadurl`, {path: path})
      },
      hashExist (school, hash) {
        return this.$http.post(apiRoot+`/dbfs/${school}/hashExist`, {hash: hash})
      },
      list (school, path, detail = '0') {
        return this.$http.post(apiRoot+`/dbfs/${school}/list`, {path: path, detail: detail})
      },
      addFolder(school, path) {
        return this.$http.post(apiRoot+`/dbfs/${school}/newFolder`, {path: path})
      },
      link (school, path, hash) {
        return this.$http.post(apiRoot+`/dbfs/${school}/link`, {path: path, hash: hash})
      },
      upload (school, data, pcb) {
        return ajaxFile(apiRoot+`/dbfs/${school}/upload`, data, pcb)
          //.then(r => console.log(r));
      }
    },
    user: {
      init ({}, store) {
        // console.log('user.init', this, store)
        if (store.username.length > 0) {
          return this.login(store.username, store.password)
            .then(r => {
              console.log('user done')
              return r
            }).catch(e => {
              console.error('user err', e)
            })
        } else {
          return this.info()
            .then(r => {
              if (r.CollegeId === null || r.AcademyId === null || r.enterYear === null) {
                throw new Error('信息未补全')
              } else {
                this.store.isLogin = true
                store.user = r
              }
            }).catch(e => {
              console.error('user err', e)
            })
        }
      },
      store: {
        isLogin: false
      },
      resetpw (username, password) {
        return this.$http.post(apiRoot+'/user/resetpw', {
          username,
          password
        })
      },
      modify (data) {
        return this.$http.post(apiRoot+'/user/modify', data)
      },
      infoByName (nickname) {
        return this.$http.post(apiRoot+'/user/infobyname', {nickname: nickname})
      },
      xsqToken () {
        return this.$http.post(apiRoot+'/user/xsqToken')
      },
      oauthLogin (platform, openId, accessToken) {
        return this.$http.post(https(apiRoot+'/user/oauthLogin'), {
          platform,
          openId,
          accessToken
        }).then(r => {
          r.data.avatar = `${urlRoot}/${r.data.avatar}`
          this.store.user = r.data
          this.user.store.isLogin = true
          return r
        })
      },
      login (un, pw) {
        return this.$http.post(https(apiRoot+'/user/login'), {un: un, pw: pw})
          .then((r) => {
            r.data.avatar = `${urlRoot}/${r.data.avatar}`
            this.store.username = un
            this.store.password = pw
            this.store.user = r.data
            this.user.store.isLogin = true
            return r
          })
      },
      info () {
        return this.$http.post(apiRoot+'/user/info')
          .then(r => {
            r.data.avatar = `${urlRoot}/${r.data.avatar}`
            this.store.user = r.data
            return r
          })
      },
      logout () {
        return this.$http.post(apiRoot+'/user/logout')
          .then(r => {
            this.store.username = ''
            this.store.password = ''
            this.store.user = {}
            this.user.store.isLogin = false
            return r
          })
      },
      sendCode (phone) {
        return this.$http.post(apiRoot+'/user/sendcode', {phone: phone})
      },
      checkCode (code) {
        return this.$http.post(apiRoot+'/user/verifycode', {code: code})
      },
      register (data) {
        return this.$http.post(https(apiRoot+'/user/register'), data)
      },
      uploadAvatar (avatar) {
        let formData = new FormData()
        formData.append('avatar', avatar)
        return this.$http.post(apiRoot+'/user/upload', formData)
          .then(r => {
            r.data.avatar = `${urlRoot}/${r.data.avatar}`
            return r
          })
      }
    },
    ad: {
      store: {},
      init () {
        return this.list()
          .then(r => {
            console.log('ad: ', r)
            if (r.androidVer > manifest.version) {
              MessageBox.confirm('有新版本更新了, 是否下载?', '更新提示')
                .then(() => {
                  console.log('download new version')
                  window.open(r.androidUrl, '_system')
                })
                .catch(() => null)
            }
            if (r.pic) {
              if (!/^https?:\/\//.test(r.pic)) {
                r.pic = `${urlRoot}/${r.pic}`
              }
            }
            this.store = r
          })
      },
      list () {
        return this.$http.post(apiRoot+'/sb/getsb')
      }
    },
    school: {
      init () {
        return this.list()
      },
      store: {
        schoolList: []
      },
      list () {
        return this.$http.post(apiRoot+'/school/list')
          .then(putData(r => {
            this.school.store.schoolList = r
          }))
      },
      listCourse (college) {
        return this.$http.post(apiRoot+'/school/listCourse', {college: college})
      },
      listAcademy (college) {
        return this.$http.post(apiRoot+'/school/listAcademy', {college: college})
      }
    },
    good: {
      store: {
        list: []
      },
      list () {
        return this.$http.post(apiRoot+'/good/list')
          .then(putData(r => {
            this.good.store.list = r
          }))
      },
      list2 () {
        return this.$http.post(apiRoot+'/good/list2')
          .then(putData(r => {
            this.good.store.list = r.list
          }))
      }
    },
    order: {
      add (data) {
        return this.$http.post(apiRoot+'/order/add', data)
      },
      pay (uuid, type = 'alipay') {
        let response
        return this.$http.post(apiRoot+'/order/pay', {uuid, type})
          .then(r => {
            // r: {body: { type: alipay, payinfo: "1234" }}
            response = r
            const body = r.body
            switch (body.type) {
              case 'alipay':
                return alipay(body.payinfo)
            }
            throw '支付方式错误'
          })
          .then(() => {
            return response
          })
          .catch(e => {
            services.utils.toast(e)
          })
      },
      list (page = 1) {
        return this.$http.post(apiRoot+'/order/list', { page })
      }
    }
  }
});

function putData(fn) {
  return function pd(r) {
    try {
      fn(r.body)
    } catch (e) {}
    return r
  }
}

// function apiRC(r) {
//   //make return code to error(reject)
//   r = r.data;
//   if (r.code !== 0) {
//     var err = new Error(r.info);
//     err.code = r.code;
//     err.res = r.res;
//     throw err;
//   } else {
//     return r.res;
//   }
// }

function apiRC(r) {
  if (r.status === 0) {
    return r.data
  } else {
    var err = new Error(r.statusText);
    err.code = r.status;
    err.res = r.data;
    services.utils.toast(r.statusText)
    throw err;
  }
}

export default services;

function ajaxFile(url, data, pcb) {
  pcb = pcb || (() => 0);
  var formData = new FormData();
  Object.keys(data).forEach((key) => formData.append(key, data[key]));
  return $.ajax({
    url: url,
    type: "POST",
    data: formData,
    xhr: () => {
      var myXhr = $.ajaxSettings.xhr();
      if(myXhr.upload){
        myXhr.upload.addEventListener('progress', (e) => pcb(e.loaded, e.total), false);
      }
      return myXhr;
    },
    contentType: false,
    processData: false
  }).then(r => ({
    data: r
  }));

}
