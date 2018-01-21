<template lang="pug">
.comment-item
  sender-bar(
    :time='comment.create_time | friendlyTime',
    :creator='comment.creator'
  )
    slot(slot='right', name='right')
  .content
    .text(v-text='comment.content')
    .referrer(v-if='comment.replyTo', @click='onClickRef')
      .refcontent(v-text='replyContent')
</template>
<style lang="less" scoped>
.comment-item {
  position: relative;
  background-color: #fff;
  &:after {
    content: " ";
    position: absolute;
    display: block;
    left: 10px;
    right: 0;
    bottom: 0;
    height: 1px;
    background-color: #eee;
  }
  // margin-top: 15px;
  .content {
    padding: 0 10px;
    padding-left: 60px;
    padding-bottom: 10px;
    .text {
      margin-bottom: 5px;
    }
    .referrer {
      background-color: rgb(220, 244, 248);
      border-radius: 5px;
      padding: 5px;
      .refcontent {
        display: inline;
      }
    }
  }
}
</style>
<script>
/*eslint eqeqeq: "off"*/
import SenderBar from 'components/sender-bar'
export default {
  name: 'comment-item',
  components: {
    SenderBar
  },
  props: {
    comment: {
      required: true
    },
    prefix: {
      default: '回复@'
    },
    suffix: {
      default: '的评论: '
    }
  },
  computed: {
    replyContent () {
      let comment = this.comment.replyTo
      if (comment.content === '') {
        return '该评论已删除'
      } else {
        return `${this.prefix}${comment.creator.nickname}${this.suffix}${comment.content}`
      }
    }
  },
  methods: {
    onClickRef () {
      this.$emit('clickref')
    }
  }
}
</script>