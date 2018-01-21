import Vue from 'vue'
const FileTransfer = window.FileTransfer
const localStorage = window.localStorage
const LSKey = 'downloadManager'
const now = () => new Date().getTime()
function W (func, context = null) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      args.push(resolve)
      args.push(reject)
      try {
        func.apply(context || this, args)
      } catch (e) {
        reject(e)
      }
    })
  }
}
const resolveLocalFileSystemURLAsync = W(window.resolveLocalFileSystemURL)

function getStorageDir () {
  return resolveLocalFileSystemURLAsync('cdvfile://localhost/sdcard/')
    .then(dir => {
      const getDirectory = W(dir.getDirectory, dir)
      return getDirectory('期末考啦', {create: true})
    })
}
class Sson {
  constructor () {
    this._fields = []
  }
  toJSON () {
    let obj = {}
    for (let f of this._fields) {
      obj[f] = this[f]
    }
    return obj
  }
  static fromJSON (Cls, val) {
    let obj = new Cls()
    for (let f of Object.keys(val)) {
      if (obj._fields.includes(f)) {
        obj[f] = val[f]
      }
    }
    return obj
  }
}
class FileItem extends Sson {
  constructor () {
    super()
    this.filename = ''
    this.path = ''
    this.md5 = ''
    this.lastOp = 0
    this.size = 0
    this.downTime = 0
    this.nativeURL = ''
    this.failReason = ''
    this.transfer = null
    this.progress = {
      loaded: 0,
      total: 0
    }
    this._fields = [
      'filename',
      'path',
      'md5',
      'lastOp',
      'size',
      'downTime',
      'nativeURL',
      'failReason'
    ]
  }
  recordOpTime () {
    this.lastOp = now()
  }
  static fromJSON (val) {
    return super.fromJSON(FileItem, val)
  }
}
const DownloadManager = Vue.extend({
  name: 'download-manager',
  methods: {
    init () {
      if (!window.cordova) return
      return getStorageDir()
        .then(dir => {
          // window.dir = dir
          dir.getFileAsync = W(dir.getFile, dir)
          this.dir = dir
        })
    },
    deleteByMd5 (md5) {
      let chain = Promise.resolve()
      let task = this.byMd5[md5]
      if (task.transfer) {
        task.transfer.onprogress = null
        task.transfer.abort()
        task.transfer = null
      }
      if (task.nativeURL !== '') {
        chain = chain.then(() => resolveLocalFileSystemURLAsync(task.nativeURL))
          .then(fileEntry => {
            const remove = W(fileEntry.remove, fileEntry)
            return remove()
          })
      }
      chain = chain.then(() => {
        console.log('delete success', md5)
      }).catch(e => {
        console.log('delete failed', md5, e)
      }).then(() => {
        let index = this.items.indexOf(task)
        if (index > -1) {
          this.items.splice(index, 1)
        }
      })
      return chain
    },
    downloadFile (file, path, url) {
      /*
        size: "123", //单位: Byte
        name: "abc.txt",
        ctime: 1472185422506, //创建时间
        nick: "上传用户",
        uid: 1,
        md5: "xxxxx"
      */
      let task = new FileItem()
      task.filename = file.name
      task.path = path
      task.md5 = file.md5
      task.lastOp = now()
      task.size = file.size
      task.progress = {
        loaded: 0,
        total: 1
      }
      this.items.push(task)

      let transfer = new FileTransfer()
      transfer.onprogress = progressEvent => {
        task.progress.loaded = progressEvent.loaded
        task.progress.total = progressEvent.total
      }
      this.getDest(file).then(fileurl => {
        console.log('fileurl: ', fileurl)
        transfer.download(
          url,
          fileurl,
          r => {
            task.nativeURL = r.toURL()
            task.downTime = now()
          },
          e => {
            console.log(e)
            task.failReason = e
          }
        )
        task.transfer = transfer
      })
    },
    getDest (file) {
      // TODO 重名处理
      let i = 0
      let filenameGen = () => {
        const re = /^(.*?)(\.[^\.]+)$/
        if (i++ === 0) {
          return file.name
        } else {
          return file.name.replace(re, (_, pre, suf) => `${pre} (${i})${suf}`)
        }
      }
      let next = () => {
        let filename = filenameGen()
        console.log('try filename', filename)
        if (i > 100) {
          console.log('wtf? tried 100 times.')
          throw new Error('循环过多次')
        }
        return this.dir.getFileAsync(filename, {}).then(next, () => out(filename))
      }
      let out = filename => {
        console.log('got dest fileurl:', `${this.dir.nativeURL}/${filename}`)
        return `${this.dir.nativeURL}/${encodeURIComponent(filename)}`
      }

      return next()
      // return `${this.dir.nativeURL}/${file.name}`
    },
    save () {
      let json = {
        items: this.items.map(i => i.toJSON())
      }
      localStorage.setItem(LSKey, JSON.stringify(json))
    },
    load () {
      // read from local storage
      let json = localStorage.getItem(LSKey)
      try {
        json = JSON.parse(json)
      } catch (e) {
        json = null
      }
      if (json) {
        this.items = json.items.map(i => FileItem.fromJSON(i))
        this.items = this.items.filter(i => i.nativeURL !== '')
      }
    }
  },
  computed: {
    byMd5 () {
      let map = {}
      for (let file of this.items) {
        map[file.md5] = file
      }
      return map
    }
  },
  data () {
    return {
      items: []
    }
  },
  created () {
    this.load()
    // const self = this
    // const afterEach = () => {
    //   this.save()
    // }
    // const makeWrapper = func => {
    //   return function (...args) {
    //     func.apply(self, args)
    //     afterEach()
    //   }
    // }
    // const wrapList = ['downloadFile']
    // for (let i of wrapList) {
    //   this[i] = makeWrapper(this[i])
    // }
  },
  watch: {
    items: {
      handler: 'save',
      deep: true
    }
  }
})
let downloadManager = new DownloadManager()
window.DownloadManager = downloadManager
export default downloadManager
