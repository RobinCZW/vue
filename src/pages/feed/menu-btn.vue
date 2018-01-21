<template lang="pug">
.menu-btn(@click.self='visible=true')
  div(v-if='visible', v-transfer-dom)
    mt-actionsheet(:visible.sync='visibleAfter', :actions='actions', @transitionend='onTransitionend')
</template>
<style>
.menu-btn {
  display: inline-block;
  background-image: url("~assets/icon/xsq/cell_operate.png");
  width: 40px;
  height: 20px;
  background-repeat: no-repeat;
  background-position: top center;
  background-size: 20px;
}
</style>
<script>
export default {
  props: {
    actions: {
      default: () => []
    }
  },
  data () {
    return {
      visible: false,
      visibleAfter: false
    }
  },
  watch: {
    visible (val) {
      if (val) {
        this.$nextTick(() => this.visibleAfter = true)
      }
    }
  },
  methods: {
    onTransitionend () {
      if (!this.visibleAfter) {
        this.visible = false
      }
    }
  }
}
</script>