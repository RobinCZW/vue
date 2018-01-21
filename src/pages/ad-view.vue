<<template lang="pug">
  .ad-view
    .pic(:style='{backgroundImage: "url(\\""+pic+"\\")"}')
    .skip(@click='skip') 跳过 {{remain}}
</template>

<script>
import services from 'utils/services'
export default {
  computed: {
    pic () {
      return services.ad.store.pic
    }
  },
  methods: {
    skip () {
      if (this.minusId) {
        clearTimeout(this.minusId)
      }
      this.$emit('done')
    },
    minus () {
      this.remain--
      if (this.remain > 0) {
        setTimeout(() => this.minus(), 1000)
      } else { // 0
        this.$emit('done')
      }
    }
  },
  ready () {
    setTimeout(() => this.minus(), 1000)
  },
  data () {
    return {
      remain: 3,
      minusId: null
    }
  }
}
</script>

<style lang="less">
.ad-view {
  position: fixed;
  left: 0;
  right:0;
  top: 0;
  bottom: 0;
  .pic {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  }
  .skip {
    position: absolute;
    right: 5%;
    top: 8%;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.5);
    width: 60px;
    height: 30px;
    padding: 3px;
    text-align: center;
    box-sizing: border-box;
    color: white;
    font-size: 14px;
  }
}
</style>
