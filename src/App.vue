<template>
  <div id="app">
    <Map :lineNames="lineNames"/>
  </div>
</template>

<script>
  import Map from './components/Map.vue'

  export default {
    components: {Map},
    data () {
      return {
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
</style>
