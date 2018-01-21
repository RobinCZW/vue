<template lang="pug">
.cross-btn(@click='back')
</template>
<style lang="less" scoped>
.cross-btn {
  color: #fff;
  height: 40px;
  width: 40px;
  background-image: url("~assets/icon/header/close.png");
  background-size: 40px;
  margin-left: -10px;
  margin-top: -10px;
}
</style>
<script>
export default {
  name: 'cross-btn',
  methods: {
    back () {
      if (this.onClick) {
        this.onClick()
      } else {
        window.history.back()
      }
    }
  },
  props: {
    onClick: {
      default: null
    }
  }
}
</script>