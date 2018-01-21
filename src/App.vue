<template lang="pug">
.app(v-cloak, v-on-resize)
  router-view.fix-pos(keep-alive, transition='screen')
  ad-view(v-if='showAd', @done='adDone')
</template>

<script>
import Vue from 'vue'
import services from 'utils/services'
import AdView from './pages/ad-view'
const Util = Vue.util

function setupCss (el, cls, cb) {
  function onEnd (e) {
    if (e.target === el) {
      Util.removeClass(el, cls)
      Util.off(el, Util.transitionEndEvent, onEnd)
      cb()
    }
  }
  Util.addClass(el, cls)
  Util.on(el, Util.transitionEndEvent, onEnd)
}
function enterCss (el, cls, cb) {
  function onEnd (e) {
    if (e.target === el) {
      Util.off(el, Util.transitionEndEvent, onEnd)
      console.log('enter done')
      cb()
    }
  }
  Util.addClass(el, cls)
  var f = document.documentElement.offsetHeight
  Vue.nextTick(() => {
    Util.removeClass(el, cls)
    Util.on(el, Util.transitionEndEvent, onEnd)
  })
  return f
}
export default {
  components: {
    AdView
  },
  transitions: {
    screen: {
      css: false,
      enter (el, done) {
        let cls = this.enter ? 'v-right' : 'v-left'
        enterCss(el, cls, done)
      },
      leave (el, done) {
        let cls = this.enter ? 'v-left' : 'v-right'
        setupCss(el, cls, done)
      }
    }
  },
  ready () {
    this.$router.beforeEach(({from, to, next}) => {
      // console.log(from, to, next)

      let enter = true
      if (this.route.length > 0) {
        // console.log(this.route[this.route.length - 1])
        if (to.path === this.route[this.route.length - 1]) {
          // back
          this.route.pop()
          enter = false
        } else {
          this.route.push(from.path)
        }
      } else {
        this.route.push('')
      }
      this.trans = enter ? 'enter' : 'leave'
      this.enter = enter

      next()
    })
    if (services.ad.store.enabled) {
      this.showAd = true
    } else {
      this.startup()
    }
  },
  data () {
    return {
      contentHeight: 0,
      trans: 'enter',
      route: [],
      enter: true,
      showAd: false
    }
  },
  events: {
    resize (w, h) {
      this.contentHeight = h - services.config.statusBarHeight // (services.config.myStatusBar ? 20 : 0)
    }
  },
  methods: {
    adDone () {
      this.showAd = false
      this.startup()
    },
    startup () {
      if (services.user.store.isLogin) {
        console.log('login, goto home')
        this.$router.go({
          name: 'home'
        })
      } else {
        console.log('not login, goto first page')
        this.$router.go({
          name: 'first'
        })
      }
    }
  }
}
</script>

<style lang="less">
@import '~vux/src/styles/reset';
button , a , input {
  outline: 0;
}
body {
  background-color: #fbf9fe;
  font-family: "Helvetica Neue", Helvetica, Arial, "Microsoft YaHei", sans-serif;
  user-select: none;
  overflow: hidden;
  outline: 0;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
html, body {
  height: 100%;
}
.vux-header {
  background-color: #508CEE !important;
  .vux-header-left a {
    color: #fff !important;
  }
}
.weui_tab {
  .weui_tabbar {
    z-index: 0;
  }
}
.app {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #fbf9fe;
  &[v-cloak] {
    visibility: hidden;
  }
}

.screen-transition {
  transition: all .3s ease;
  position: absolute;
  top: 0;
  height: 100%;
  width: 100%;
}

.v-right {
  transform: translate3d(100vw,0,0);
  width: 100%;
}
.v-left {
  transform: translate3d(-100vw,0,0);
  width: 100%;
}
</style>
