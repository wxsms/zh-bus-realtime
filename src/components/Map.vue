<template>
  <div id="map"></div>
</template>

<script>
  import L from 'leaflet'
  import 'leaflet/dist/leaflet.css'

  export default {
    mounted () {
      this.initMap()
    },
    methods: {
      initMap () {
        const map = L.map('map', {
          zoom: 10,  //初始聚焦程度
          center: [23.16, 113.23],  //广州
          minZoom: 3,  //最宽广，越小越宽广
          maxZoom: 18, //最细致，越大越细致
        })
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
          subdomains: ['1', '2', '3', '4'], //可用子域名，用于浏览器并发请求
          attribution: '&copy; 高德地图',
        }).addTo(map)
      }
    }
  }
</script>

<style scoped lang="less">
  #map {
    height: 100%;
  }
</style>
