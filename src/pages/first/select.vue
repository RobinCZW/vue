<template lang="pug">
  .select-frag
    img(:style='imgStyle', src='~assets/splash.png')
    .footer
      .btn-group
        button.button.login(v-link='loginLink') 登录
        // button.button.right(v-link='registerLink') 注册
        .clear
</template>

<script>
import services from 'utils/services'
export default {
  computed: {
    loginLink () {
      return {
        append: true,
        query: {
          action: 'login'
        }
      }
    },
    registerLink () {
      return {
        append: true,
        query: {
          action: 'register'
        }
      }
    },
    imgStyle () {
      return {
        marginTop: -services.config.statusBarHeight + 'px'
      }
    }
  }
}
</script>

<style lang="less" scoped>
button {
  font-family: "Helvetica Neue", Helvetica, Arial, "Microsoft YaHei", sans-serif;
}
.select-frag {
  overflow: visible;
  width: 100%;
  height: 100%;
  img {
    position: fixed;
    // left: 0;
    // width: 100%;
    // margin-top: -20px;
    // position: absolute;
    width: 100%;
  }
  .footer {
    box-shadow: 0 0 8px rgba(0,0,0,.33);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    
    background-color: rgba(255,255,255,1);
    opacity: 1;

    .btn-group {
      width: 90%;
      height: 40px;
      margin: 20px auto;

      .button {
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 5px;
        height: 100%;
        text-align: center;
        display: block;
        font-size: 16px;
      }
      .button:active {
        background-color: #aaa;
      }
      .login {
        width: 100%;
      }
      .right {
        float: right;
        border-width: 0;
        color: #fff;
        background-color: rgb(78,141,238);
      }
      .clear {
        clear: both;
      }
    }
  }
}
</style>