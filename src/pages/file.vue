<template lang="pug">
.file-page
  page-scroll.stack(:title='curFolder', :loading='$loadingRouteData', :watch-data='uniList', :top-method='refreshData', v-touch:swiperight="onSwipeRight")
    div(slot='left')
      back-btn
    div(v-for='item in uniList', transition2='file-trans2', @click='enter(item)')
      vue-ripple
        file-item(@click='',:is-folder='item.isFolder',:size='item.size',:name='item.name')
    .no-file(v-if='!$loadingRouteData && uniList.length === 0')
      img(src='~assets/icon/nofiles.png')
  file-detail.stack(
    v-if='detailView',
    :file='curFile',
    transition='popup',
    @download='onDownload'
  )
</template>

<script>
import services from 'utils/services'

export default {
  methods: {
    onDownload () {
      return services.dbfs.getDownloadUrl(this.schoolId, this.curPath + this.curFile.name)
        .then(r => {
          console.log('url to download:', r.url)
          services.download.downloadFile(this.curFile, this.curPath, r.url)
        })
    },
    onSwipeRight () {
      window.history.back()
    },
    enter (item) {
      if (item.isFolder) {
        this.$router.go({
          name: 'file',
          params: {
            school: this.schoolId,
            path: this.cutPath + item.name + '/'
          }
        })
      } else {
        this.curFile = item
        this.$router.go({
          name: 'file',
          params: this.$route.params,
          query: {
            detail: '1'
          }
        })
      }
    },
    refreshData () {
      if (!this.schoolId) {
        return Promise.resolve() // impossible
      }
      this.loading = true
      return services.dbfs.list(this.schoolId, this.curPath, 1)
        .then((ret) => {
          this.files = ret.files
          this.folders = ret.folders
          this.loading = false
        })
        .catch(e => {
          console.log('login err:', e)
          this.loading = false
        })
    }
  },
  route: {
    data () {
      if (this.loadedPath === this.curPath) {
        return true
      }
      this.files = []
      this.folders = []
      return this.refreshData()
        .then(() => true)
    }
  },
  data () {
    return {
      status: '',
      files: [],
      folders: [],
      loading: true,
      loadedPath: '/',
      curFile: {}
    }
  },
  computed: {
    rootPath () {
      return this.loadedPath === '/'
    },
    curPath () {
      let path = this.$route.params.path || ''
      return '/' + path
    },
    cutPath () { // 给路由当参数
      return this.curPath.substr(1)
    },
    schoolId () {
      return this.$route.params.school
    },
    uniList () {
      let list = this.folders.map(i => {
        i.isFolder = true
        return i
      })
      return list.concat(this.files.map(i => {
        i.isFolder = false
        return i
      }))
    },
    curFolder () {
      return /([^\/]*)\/$/.exec(this.loadedPath)[1]
    },
    detailView () {
      return this.$route.query.detail === '1'
    }
  },
  watch: {
    curPath: 'refreshData',
    loading (val) {
      if (val === false) {
        this.loadedPath = this.curPath
      }
    }
  }
}
</script>

<style lang="less" scoped>
.file-page{
  position: relative;
  .no-file {
    box-sizing: border-box;
    padding: 0 10%;
    width: 100%;
    &>img {
      display: block;
      margin: 0 auto;
      filter: contrast(94%) sepia(5%) hue-rotate(235deg);
    }
  }
  .file-trans-transition {
    transition: all 3s ease;
  }
  .file-trans-enter {
    // transform: translateX(-100%);
    transition-delay: 3s;
    opacity: 0; 
  }
  .file-trans-leave {
    // transform: translateX(100%);
    opacity: 0; 
  }
  .file-trans-move {
    transition: transform .3s cubic-bezier(.55,0,.1,1)
  }

  .stack {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
  }
  .popup-transition {
    transition: all .3s ease;
  }
  .popup-enter {
    transform: translateY(100%)
  }
  .popup-leave {
    transform: translateY(100%)
  }
}
</style>