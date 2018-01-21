<template lang="pug">
.feed-detail
  page-scroll(title='动态详情', :loading='loading', :top-method='refreshData', :bottom-method='loadmore', :watch-data='comments', :footer-height='footerHeight')
    back-btn(slot='left')
    .container
      .input-mask(v-show='inputing', @click='closeInput')
      feed-item(:data='feed', :bar='false')
      .no-comment(v-if='!loading && comments.length === 0')
        img(src='~assets/icon/xsq/no_comment.png')
      comment-item(v-for='item in comments', :comment='item')
        div(slot='right')
          // .reply(@click='onReplyTo(item)')
          comment-btn(@click='onReplyTo(item)')
          menu-btn(:actions='getAction(item)')
    .fix-input(slot='footer', v-el:fix-input)
      .tool-bar(v-show='inputing')
        check-box.left(:value.sync='anonymous') 匿名
        mt-button.send.right(@click='sendComment') 发送
        .remain.right {{ 140 - comment.length }}
      .wrap(@click='openInput')
        flex-textarea(v-ref:text, :value.sync='comment', :height.sync='inputHeight', :placeholder='placeholder', maxlength='140')
</template>
<style lang="less" scoped>
.fix-input {
  // position: fixed;
  // bottom: 0;
  // left: 0;
  width: 100%;
  background-color: #f0f0f0;
  box-sizing: border-box;
  padding: 5px;
  .tool-bar {
    height: 35px;
    .left {
      float: left;
    }
    .right {
      float: right;
    }
    .send {
      height: 28px;
    }
    .remain {
      color: #aaa;
      margin-right: 5px;
    }
  }
  .wrap {
    border: 5px solid #fff;
    border-radius: 5px;
  }
}
.feed-detail {
  height: 100%;
  position: relative;
  .container {
    padding-bottom: 15px;
    position: relative;
    .input-mask {
      position: absolute;
      height: 100%;
      width: 100%;
      left: 0;
      top: 0;
      z-index: 100;
    }
    .no-comment {
      background-color: #fff;
      padding: 5px;
      &::after {
        display: block;
        content: "还没有评论, 你来评一个";
        text-align: center;
      }
      &>img {
        display: block;
        margin: 0 auto;
      }
    }
    .comment-right {
      &>div {
        width: 20px;
        height: 20px;
        background-size: 20px;
      }
      .reply {
        background-image: url("~assets/icon/xsq/comment.png");
      }
      .more {
        background-image: url("~assets/icon/xsq/cell_operate.png");
      }
    }
  }
}
</style>
<script>
// const iconCellOp = require('assets/icon/xsq/cell_operate.png')
import MenuBtn from './menu-btn'
import CommentBtn from './comment-btn'
import Group from 'vux-components/group'
import services from 'utils/services'
export default {
  components: {
    Group,
    MenuBtn,
    CommentBtn
  },
  props: {
    // feed: {
    //   required: true
    // }
  },
  data () {
    return {
      next: null,
      loading: false,
      inputHeight: 0,
      inputing: false,
      comment: '',
      anonymous: true,
      replyTo: null
    }
  },
  computed: {
    feed () {
      return services.global.curFeed
    },
    feedId () {
      return this.feed.id
    },
    comments () {
      // if (this.loading) return []
      return services.xsq.store.commentList
    },
    footerHeight () {
      return this.inputHeight + (this.inputing ? 35 : 0)
    },
    placeholder () {
      if (this.replyTo) {
        return `回复 ${this.replyTo.creator.nickname}`
      }
      return '点此输入你的评论'
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
            services.xsq.deleteComment(this.feedId, item.id)
              .then(
                () => services.utils.toast('删除成功'),
                () => services.utils.toast('删除失败')
              )
          }
        })
      }
      return actions
    },
    focusComment () {
      this.$refs.text.focus()
      this.openInput()
    },
    onReplyTo (item) {
      console.log('reply to', item.creator)
      this.replyTo = item
      this.focusComment()
    },
    openInput () {
      // this.inputing = true
      let query = this.$route.query
      query.inputing = 1
      this.$router.go({
        query
      })
    },
    closeInput () {
      // this.inputing = false
      console.log('close')
      this.replyTo = null
      window.history.back()
      document.activeElement.blur()
    },
    loadmore () {
      if (this.next) {
        return services.xsq.listComment(this.feedId, this.next)
          .then(this.loadEnd, this.loadEnd)
      }
    },
    loadEnd (r) {
      this.inputHeight++ // reset the height
      this.inputHeight--
      this.next = r.next
      this.loading = false
    },
    refreshData () {
      return services.xsq.listComment(this.feedId)
        .then(this.loadEnd, this.loadEnd)
    },
    sendComment () {
      if (this.comment.length === 0) {
        services.utils.toast('请输入评论再发送')
        return
      }
      this.loading = true
      return services.xsq.sendComment(this.comment, this.feed, this.anonymous, this.replyTo)
        .then(() => {
          this.comment = ''
        })
        .then(this.closeInput)
        .then(this.refreshData)
        .catch(this.loadEnd)
    }
  },
  watch: {
    feedId (feedId) {
      services.xsq.store.commentList = []
      this.loading = true
      this.refreshData()
    },
    '$route.query.inputing': function (val) {
      // if (!val) {
      //   this.inputing = false
      // }
      this.inputing = !!val
    }
  },
  ready () {
    this.loading = true
    services.xsq.store.commentList = []
    this.refreshData()
  }
}
</script>