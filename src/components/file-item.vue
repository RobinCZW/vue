<template lang="pug">
  .file-item
    img(:src='icon')
    div.detail
      div.name(v-text='name')
      div.filesize(v-show='displaySize!=""', v-text='displaySize')
</template>

<style lang='less' scoped>
div {
  box-sizing: border-box;
}
.file-item {
  position: relative;
  padding: 10px;
  height: 70px;

  &:before {
    content: " ";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    border-top: 1px solid #D9D9D9;
    color: #D9D9D9;
    transform-origin: 0 0;
    transform: scaleY(0.5);
  }
  img {
    display: inline-block;
    height: 50px;
  }
  .detail {
    display: inline-block;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 60px;
    padding: 10px;

    .filesize {
      text-align: right;
      color: gray;
      font-size: 0.9em;
    }
    .name {
      font-size: 1em;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
</style>

<script>
import { getTypeUrl, folderIcon, displaySize } from 'utils/file'
export default {
  name: 'file-item',
  props: {
    name: {
      required: true
    },
    size: {
      default: 0
    },
    isFolder: {
      default: false
    }
  },
  computed: {
    displaySize () {
      if (this.isFolder) {
        return ''
      }
      return displaySize(this.size)
    },
    icon () {
      if (this.isFolder) {
        return folderIcon
      }
      return getTypeUrl(this.name)
    }
  }
}
</script>