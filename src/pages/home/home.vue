<template lang="pug">
//- .weui_tab
//-   .weui_tab_bd
//-     router-view(transition='page',@hide-bar='tabShow=false',@show-bar='tabShow=true')
//-   tabbar(transition='tabbar', v-show='tabShow')
//-     tabbar-item(v-for='tab in tabs', @click='changeTab(tab)', :link='tab.link', :selected='tab.selected')
//-       img(slot='icon',:src='dynIcon(tab)')
//-       span(slot='label', v-text='tab.name')
.home-root
  mt-tab-container(:active.sync='active', :swipeable='false')
    mt-tab-container-item.tabc-item(v-for='tab in tabs', :id='tab.id')
      component(:is='tab.id', @changetab='onChangeTab', :attaching='attaching')
  mt-tabbar(:selected.sync='active', transition2='tabbar', v-show='tabShow')
    mt-tab-item(v-for='tab in tabs', :id='tab.id')
      img(slot='icon',:src='dynIcon(tab)')
      | {{ tab.name }}
</template>
<style lang="less">
.home-root {
  height: 100%;
  bottom: 0;
  .mint-tabbar > .mint-tab-item.is-selected {
    background-color: #fafafa !important;
  }
  .tabc-item {
    width: 100%;
  }
}

.page-transition {
  transition: all .3s ease;
  /*transition: all .3s ease;*/
}
.page-enter {
  /*transform: translateY(100vh);*/
  opacity: 0;
}
.page-leave {
  /*transform: translateX(100vw);*/
  transition-delay: .3s;
  opacity: 0;
}

.tabbar-transition {
  transition: all .1s ease;
}
.tabbar-enter , .tabbar-leave {
  transform: translateY(100%);
}

.weui_tabbar_item.weui_bar_item_on .weui_tabbar_label {
  color: #0092ff !important;
}
</style>
<script>
// import Tabbar from 'vux-components/tabbar/tabbar'
// import TabbarItem from 'vux-components/tabbar/tabbar-item'
import Course from './course'
import Download from './download'
import Community from './community'
import User from './user'
import Print from './print'

function iconPair (name) {
  return [
    require(`assets/icon/tabbar/${name}1.png`),
    require(`assets/icon/tabbar/${name}2.png`)
  ]
}
export default {
  methods: {
    dynIcon (tab) {
      return tab.icon[this.active === tab.id ? 1 : 0]
    },
    onChangeTab (val) {
      this.tabShow = val
    }
  },
  ready () {
  },
  attached () {
    this.attaching = true
  },
  detached () {
    this.attaching = false
  },
  data () {
    return {
      attaching: false,
      active: 'print',
      tabShow: true,
      tabs: [{
        id: 'print',
        name: '打印',
        icon: iconPair('5')
      }, {
        id: 'course',
        name: '资料',
        icon: iconPair('1')
      }, {
        id: 'download',
        name: '已下载',
        icon: iconPair('2')
      }, {
        id: 'community',
        name: '学生圈',
        icon: iconPair('3')
      }, {
        id: 'user',
        name: '发现',
        icon: iconPair('4')
      }]
    }
  },
  components: {
    Course,
    Download,
    Community,
    User,
    Print
  },
  computed: {
    contentHeight () {
      return this.parentHeight - (this.tabShow ? 55 : 0)
    }
  },
  watch: {
    active () {
      //
    }
  }
}
</script>
