<template>
  <div class="map-container">
    <div id="map"></div>
  </div>
</template>

<script>
  import L from 'leaflet'
  import * as service from '../services/zhBusService'
  import findIndex from 'lodash/findIndex'

  delete L.Icon.Default.prototype._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  })

  const busStationIcon = L.icon({
    iconUrl: '/static/bus-station.png',
    iconSize: [20, 20],
    popupAnchor: [0, -10],
  })

  export default {
    props: ['lines'],
    data () {
      return {
        map: null
      }
    },
    watch: {
      lines (lines) {
        if (Array.isArray(lines)) {
          this.clearMap()
          lines.forEach(line => {
            this.drawBusLine(line.id, line.name, line.fromStation)
          })
        }
      }
    },
    mounted: async function () {
      this.initMap()
      this.drawTile()
      if (Array.isArray(this.lines)) {
        this.lines.forEach(line => {
          this.drawBusLine(line.id, line.name, line.fromStation)
        })
      }
    },
    methods: {
      initMap () {
        this.map = L.map('map', {
          zoom: 10,  //初始聚焦程度
          center: [23.16, 113.23],  //广州
          minZoom: 3,  //最宽广，越小越宽广
          maxZoom: 18, //最细致，越大越细致
        })
      },
      drawTile () {
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
          subdomains: ['1', '2', '3', '4'], //可用子域名，用于浏览器并发请求
          attribution: '&copy; 高德地图',
        }).addTo(this.map)
      },
      clearMap () {
        this.map.eachLayer((layer) => {
          this.map.removeLayer(layer)
        })
        this.drawTile()
      },
      drawBusLine: async function (lineId, lineName, fromStation) {
        const res2 = await service.getStationListByLineId(lineId)
        const stations = res2.data.data
        const pointList = stations.map(v => new L.LatLng(v.Lat, v.Lng))
        // 线路
        const polyline = new L.Polyline(pointList, {
          color: 'red',
          weight: 3,
          opacity: 0.5,
          smoothFactor: 1
        })
        polyline.addTo(this.map)
        this.map.fitBounds(pointList)
        // 站点
        stations.forEach(v => {
          L
            .marker([v.Lat, v.Lng], {
              icon: busStationIcon
            })
            .addTo(this.map)
            .bindPopup(`${v.Name}`)
        })
        const res3 = await service.getRealTimeStatusByLineNameAndHeadStation(lineName, fromStation)
        const realTimes = res3.data.data
        realTimes.forEach(v => {
          const stationIndex = findIndex(stations, {Name: v.CurrentStation})
          if (stationIndex >= 0) {
            if (v.LastPosition === 8) {
              const station = stations[stationIndex]
              L
                .marker([station.Lat, station.Lng])
                .addTo(this.map)
                .bindPopup(`${v.BusNumber}`)
            } else if (stationIndex < stations.length - 2) {
              const station = stations[stationIndex]
              const stationNext = stations[stationIndex + 1]
              const lat = (Number.parseFloat(station.Lat) + Number.parseFloat(stationNext.Lat)) / 2
              const lng = (Number.parseFloat(station.Lng) + Number.parseFloat(stationNext.Lng)) / 2
              L
                .marker([lat, lng])
                .addTo(this.map)
                .bindPopup(`${v.BusNumber}`)
            }
          }
        })
      }
    }
  }
</script>

<style scoped lang="less">
  .map-container {
    display: block;
    position: absolute;
    height: auto;
    bottom: 0;
    top: 0;
    left: 0;
    right: 0;
    margin-top: 50px;

    #map {
      height: 100%;
    }
  }
</style>
