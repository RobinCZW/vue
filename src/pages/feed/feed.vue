<template lang="pug">
.feed-page
  .fix_pos(v-show='status == "list"', transition='hold')
    .submit-btn(v-if='submitVisible', v-on-hold='onHold', v-link='submitLink')
    page-scroll(:title='title', :loading='$loadingRouteData', :watch-data='watchData', :top-method='refreshData', :bottom-method='loadmore')
      back-btn(slot='left')
      .feed-container(v-show='!$loadingRouteData')
        feed-item(v-for='item in feedList', :data='item', @detail='detailView(item)', @comment='goComment(item)')
          div(slot='right')
            menu-btn(@click.stop='', :actions='getAction(item)')
  .fix_pos(v-show='status == "submit"', transition='rotate', @transitionend='focusText')
    new-feed(v-ref:new-feed, :tid='tid', @send='refreshData')
  .fix_pos(v-if='status == "detail"', transition='right', @transitionend='focusComment')
    feed-detail(v-ref:detail, :feed='detail.feed')
</template>

<script>
import NewFeed from './new-feed'
import FeedDetail from './feed-detail'
import MenuBtn from './menu-btn'
import services from 'utils/services'
const submitNormal = require('assets/icon/xsq/submit2.png')
const submitPress = require('assets/icon/xsq/submit1.png')

export default {
  watch: {
    status (val) {
      if (val === 'submit') {
        this.$refs.newFeed.clear()
      }
    }
  },
  components: {
    NewFeed,
    FeedDetail,
    MenuBtn
  },
  data () {
    return {
      next: null,
      source: (tid, next) => {
        if (tid === 'my') {
          return services.xsq.listMyFeed(next)
        } else if (tid === 'myfav') {
          return services.xsq.listMyFav(next)
        } else {
          return services.xsq.listFeed(tid, next)
        }
      },
      detail: {
        feed: {}
      }
    }
  },
  computed: {
    watchData () {
      return [this.feedList, this.status]
    },
    title () {
      return this.$route.params.name // services.xsq.store.topic[this.tid].name
    },
    tid () {
      return this.$route.params.tid
    },
    feedList () {
      return services.xsq.store.feedList
    },
    status () {
      if (this.$route.query.status) {
        return this.$route.query.status
      }
      return 'list'
    },
    submitLink () {
      return {
        name: 'feed',
        params: this.$route.params,
        query: {
          status: 'submit'
        }
      }
    },
    submitVisible () {
      return !['my', 'myfav'].includes(this.tid)
    }
  },
  methods: {
    getAction (item) {
      let actions = [{
        name: '复制内容',
        method: () => {
          console.log('copy: ', item.content)
          if (window.cordova) {
            window.cordova.plugins.clipboard.copy(
              item.content,
              () => services.utils.toast('复制成功'),
              () => services.utils.toast('复制失败')
            )
          }
        }
      }]
      if (item.creator.id === services.xsq.uid) {
        actions.push({
          name: '删除',
          method: () => {
            console.log('delete: ', item.id)
            services.xsq.deleteFeed(item.id)
              .then(
                () => services.utils.toast('删除成功'),
                () => services.utils.toast('删除失败')
              )
          }
        })
      }
      return actions
    },
    refreshData () {
      return this.source(this.tid)
        .then(r => {
          this.next = r.next
        })
    },
    loadmore () {
      console.log('feed loadmore')
      if (this.next) {
        let bNext = this.next
        let ret = this.source(this.tid, this.next)
          .then(r => {
            this.next = r.next
          })
          .catch(r => {
            this.next = bNext
          })
        this.next = null
        return ret
      }
    },
    onHold (e, start) {
      e.currentTarget.style.backgroundImage = `url(${(start ? submitPress : submitNormal)})`
    },
    goComment (item) {
      services.global.curFeed = item
      this.$router.go({
        name: 'feed',
        params: this.$route.params,
        query: {
          status: 'detail',
          cmt: '1'
        }
      })
    },
    focusComment () {
      if (this.$route.query.cmt) {
        this.$refs.detail.focusComment()
      }
    },
    detailView (item) {
      services.global.curFeed = item
      // this.detail.feed = item
      this.$router.go({
        name: 'feed',
        params: this.$route.params,
        query: {
          status: 'detail'
        }
      })
      // services.global.curFeed = item
      // this.$router.go({
      //   name: 'feed.detail'
      // })
    },
    focusText (e) {
      if (this.status === 'submit') {
        this.$refs.newFeed.focusText()
      }
    }
  },
  route: {
    data ({ from, to: {params: {tid}} }) {
      if (from.name === 'feed') {
        if (from.params.tid === tid) {
          return {}
        }
      } else if (from.name === 'feed.detail') {
        return {}
      }
      console.log(from.name)
      return this.refreshData()
        .then(() => true)
    }
  }
}
</script>

<style lang="less" scoped>
.feed-page {
  position: relative;
  height: 100%;
  width: 100%;
  bottom: 0;
  overflow: hidden;
  .fix_pos {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100%;
  }
  .submit-btn {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 60px;
    height: 60px;
    background-image: url("~assets/icon/xsq/submit1.png");
    background-size: 60px;
    background-repeat: no-repeat;
    z-index: 999;
  }
  .feed-container {
    padding-bottom: 30px;
  }
}

.hold-transition {
  transition: all .3s ease;
}
.hold-enter {
  opacity: 1;
}
.hold-leave {
  transition-delay: .3s;
  opacity: 0;
}

.rotate-transition {
  transition: all .3s ease;
  transform-origin: right bottom;
}
.rotate-enter {
  transform: rotate(90deg);
  opacity: 0;
}
.rotate-leave {
  transition-timing-function: ease-in;
  transform: rotate(-90deg);
  opacity: 0;
}

.right-transition {
  transition: all .3s ease;
}
.right-enter, .right-leave {
  position: absolute;
  top: 0;
  transform: translateX(100%);
}
</style>