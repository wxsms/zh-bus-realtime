<template>
  <div id="app">
    <Map :lineNames="lineNames"/>
    <div class="gui">
      <input v-model="value" type="text">
    </div>
  </div>
</template>

<script>
  import Map from './components/Map.vue'

  export default {
    components: {Map},
    data () {
      return {
        value: '',
        lineNames: []
      }
    },
    mounted () {
      this.lineNames.push('K3')
    }
  }
</script>

<style lang="less">
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    width: 100vw;
    height: 100vh;
  }

  .gui {
    z-index: 99999;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  }
</style>
