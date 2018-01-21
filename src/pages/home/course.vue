<template lang="pug">
.course-page
  page-scroll(title='', :loading='initLoading', :watch-data='folders', :top-method='refreshData', :bottom-method='loadmore', :header-height='46', v-ref:scroll)
    div(slot='left')
      school-choose(:list='schoolList',:select.sync='curSchool')
    .right(slot='right')
      right-upload.right-btn
    .search(slot='header')
      search-box(slot='list-start', placeholder='直接输入课程名搜索', :value.sync='searchText', @focus='onFocus', @blur='onBlur')
    .container
      .mask(v-show='maskShow', @touchmove='onBlur')
      list-view.listview(:each-height='54', :scroll-element='$refs.scroll.$els.scroll', :items='folders | top | search | less', @click='onClick')
        .now-loading(v-if='showLoading', slot='list-end') 正在加载...
    //- .container
      //- .mask(v-show='maskShow')
      //- a(v-for='item in folders | search', @click='enter(item)', v-show='!item.hide')
      //-   vue-ripple
      //-     .course
      //-       .icon(v-text='item.name')
      //-       .name(v-text='item.name')
</template>

<script>
import PageListview from 'components/page-listview'
import SchoolChoose from './course/school-choose'
import RightUpload from './course/right-upload'
import RightOrder from './course/right-order'
import CourseItem from './course/course-item'
import ListView from 'libs/list-view'
import services from 'utils/services'
const itemComponent = {
  template: '<course-item @click="$emit(\'click\')" :course="item"></course-item>',
  components: {
    CourseItem
  }
}
function intersect (a, b) {
  let nVal = []
  a.forEach(i => {
    if (b.includes(i)) {
      nVal.push(i)
    }
  })
  return nVal
}
const listView = ListView(itemComponent)

export default {
  components: {
    PageListview,
    SchoolChoose,
    RightUpload,
    RightOrder,
    itemComponent,
    listView
  },
  props: {
    attaching: Boolean
  },
  filters: {
    top (list) {
      const top = services.store.topList
      list = list.map(i => {
        i.top = top.includes(i.name)
        return i
      })
      let topPart = list.filter(i => i.top)
      list = list.filter(i => !i.top)
      return topPart.concat(list)
    },
    search (list) {
      let searchText = this.searchText.toLowerCase()
      let names = list.map(i => i.name.toLowerCase())
      let searchChar = char => {
        return i => (i.indexOf(char) !== -1)
      }
      if (searchText.length === 0) {
        return list
      } else {
        let sub = names.filter(searchChar(searchText[0]))
        for (let i = 1; i < searchText.length; i++) {
          sub = intersect(sub, names.filter(searchChar(searchText[i])))
        }
        return list.filter(i => sub.includes(i.name.toLowerCase()))
      }
    },
    less (list) {
      let i = 0
      return list.filter(_ => i++ < this.visibleCount)
    }
  },
  methods: {
    loadmore () {
      this.visibleCount += 30
    },
    onClick (e) {
      let el = e.target
      let courseName = el.getAttribute('course-name')
      if (!courseName) return
      const clsName = el.className
      switch (clsName) {
        case 'course-item':
          let scroll = this.$refs.scroll.$els.scroll
          this.lastTop = scroll.scrollTop

          this.$router.go({
            name: 'file',
            params: {
              school: this.schoolId,
              path: courseName + '/'
            }
          })
          break
        case 'right-icon':
          let top = services.store.topList
          if (top.includes(courseName)) {
            // top = top.filter(i => i !== courseName)
            top.splice(top.indexOf(courseName), 1)
          } else {
            top.push(courseName)
            services.utils.toast('该课程已收藏置顶')
          }
          break
      }
    },
    onFocus () {
      let query = this.$route.query
      query.mask = '1'
      this.$router.go({
        query
      })
    },
    onBlur () {
      if (this.$route.query.mask === '1') {
        window.history.back()
      }
    },
    enter (item) {
      this.$router.go({
        name: 'file',
        params: {
          school: this.schoolId,
          path: item.name + '/'
        }
      })
    },
    refreshData () {
      if (!this.schoolId) {
        return Promise.resolve() // TODO
      }
      this.loading = true
      return services.dbfs.list(this.curSchool.id, '/')
        .then((ret) => {
          this.folders = ret.folders.map(i => {
            i.top = false
            return i
          })
          this.visibleCount = 30
          this.loading = false
        })
        .catch()
        .then(() => {
          this.initLoading = false
        })
    },
    syncSchool () {
      this.curSchool = {
        id: this.user.CollegeId,
        name: this.user.collegeName
      }
    }
  },
  ready () {
    this.loading = true
    // services.school.list().then(list => {
    //   this.schoolList = list
    //   this.curSchool = list[0]
    // })
    this.syncSchool()
  },
  data () {
    return {
      folders: [],
      // schoolList: [],
      curSchool: {
        id: -1
      },
      loading: true,
      initLoading: true,
      searchText: '',
      visibleCount: 30
    }
  },
  computed: {
    showLoading () {
      return (this.searchText === '') && (this.visibleCount < this.folders.length)
    },
    schoolId () {
      return this.curSchool && this.curSchool.id
    },
    user () {
      return services.store.user
    },
    maskShow () {
      let query = this.$route.query
      return query && query.mask === '1'
    }
  },
  watch: {
    schoolId: 'refreshData',
    'user.CollegeId': function (val) {
      this.syncSchool()
    },
    maskShow (val) {
      if (val === false) {
        if (document.activeElement) {
          document.activeElement.blur()
        }
      }
      this.$emit('changetab', !val)
    },
    attaching (val) {
      let scroll = this.$refs.scroll.$els.scroll
      if (val) {
        console.log('at', scroll)
        if (this.lastTop) {
          scroll.scrollTop = this.lastTop
        }
      } else {
        // console.log('de', scroll.scrollTop)
        // this.lastTop = scroll.scrollTop
      }
    }
  }
}
</script>

<style lang="less">
.course-page {
  .right {
    position: relative;
    top: -5px;
    left: 10px;
    height: 30px;
    .right-btn {
      display: inline-block;
      // width: 30px;
      height: 30px;
      margin-right: 5px;
    }
  }
  .container {
    position: relative;
    .now-loading {
      line-height: 50px;
      height: 50px;
      text-align: center;
    }
    .mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
      z-index: 100;
    }
    .listview {
      height: 100%;
    }
  }
  .course {
    height: 40px;
    line-height: 40px;
    font-size: 1em;
    padding: 7px;
    position: relative;
    overflow: hidden;

    &:after {
      content: " ";
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 1px;
      border-top: 1px solid #D9D9D9;
      color: #D9D9D9;
      transform-origin: 0 bottom;
      // transform: scaleY(0.5);
      left: 15px;
    }
    
    .icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      font-size: 0;
      border-radius: 50%;
      background-color: #f80;
      vertical-align: middle;
      margin-right: 5px;
      &::first-letter {
        font-size: 20px;
        color: #fff;
        margin-left: 10px;
      }
    }
    .name {
      display: inline-block;
    }
  }
}
</style>