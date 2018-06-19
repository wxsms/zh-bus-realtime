<template>
  <div class="map-container">
    <div id="map"></div>
    <div class="refresh-btn" v-show="lines && lines.length">
      <btn @click="refreshMap(false)" :disabled="refreshing">
        <span v-if="refreshing">......</span>
        <span v-else>刷新</span>
      </btn>
    </div>
  </div>
</template>

<script>
  import L from 'leaflet'
  import * as service from '../services/zhBusService'
  import findIndex from 'lodash/findIndex'
  import flatten from 'lodash/flatten'

  const TO_GLNG = (lng) => {
    if (typeof lng === 'string') {
      lng = Number.parseFloat(lng)
    }
    return lng + 0.005
  }
  const TO_GLAT = (lat) => {
    if (typeof lat === 'string') {
      lat = Number.parseFloat(lat)
    }
    return lat - 0.003
  }

  delete L.Icon.Default.prototype._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  })

  const busIcon = L.icon({
    iconUrl: '/static/bus.png',
    iconSize: [20, 20],
    popupAnchor: [0, -10],
  })

  const lineStartIcon = L.icon({
    iconUrl: '/static/flag-green.png',
    iconSize: [48, 48],
    iconAnchor: [10, 45],
    popupAnchor: [10, -45],
  })

  const lineEndIcon = L.icon({
    iconUrl: '/static/flag-red.png',
    iconSize: [48, 48],
    iconAnchor: [10, 45],
    popupAnchor: [10, -45],
  })

  export default {
    props: ['lines'],
    data () {
      return {
        map: null,
        busData: [],
        tileLayer: null,
        refreshing: false
      }
    },
    watch: {
      lines (lines) {
        this.refreshMap()
      }
    },
    mounted: async function () {
      this.initMap()
      this.drawTile()
      this.locateUser()
      this.map.on('click', (e) => {
        // console.log('Lat, Lon : ' + e.latlng.lat + ', ' + e.latlng.lng)
      })
      this.map.on('locationfound', (e) => {
        const radius = e.accuracy / 2
        L.layerGroup([
          L.marker([TO_GLAT(e.latlng.lat), TO_GLNG(e.latlng.lng)]).bindPopup('我的位置').openPopup(),
          L.circle([TO_GLAT(e.latlng.lat), TO_GLNG(e.latlng.lng)], radius)
        ]).addTo(this.map)
      })
      this.map.on('locationerror', (e) => {
        console.log(e.message)
      })
    },
    methods: {
      initMap () {
        this.map = L.map('map', {
          zoom: 11,  //初始聚焦程度
          center: [22.3, 113.52],
          minZoom: 3,  //最宽广，越小越宽广
          maxZoom: 18, //最细致，越大越细致
        })
      },
      centerMap () {
        const allStations = flatten(this.busData.map(v => v.stations))
        const pointList = allStations.map(v => new L.LatLng(v.Lat, v.Lng))
        if (pointList.length) {
          this.map.fitBounds(pointList)
        }
      },
      drawTile () {
        /*this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map)*/
        this.tileLayer = L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
          subdomains: ['1', '2', '3', '4'], //可用子域名，用于浏览器并发请求
          attribution: '&copy; 高德地图',
        }).addTo(this.map)
      },
      locateUser (setView = true) {
        this.map.locate({setView, maxZoom: 16})
      },
      clearMap () {
        this.map.eachLayer((layer) => {
          if (layer !== this.tileLayer) {
            this.map.removeLayer(layer)
          }
        })
      },
      refreshMap (reCenter = true) {
        this.refreshing = true
        if (Array.isArray(this.lines)) {
          const promises = []
          this.lines.forEach(line => {
            promises.push(this.fetchBusLineData(line.id, line.name, line.fromStation))
          })
          Promise
            .all(promises)
            .then((res) => {
              this.busData = res || []
              this.clearMap()
              //this.locateUser()
              this.busData.forEach(this.drawBusLine)
              //this.locateUser(false)
              if (reCenter) {
                this.centerMap()
              }
              this.refreshing = false
            })
            .catch(err => {
              console.error(err)
              this.$notify({
                type: 'danger',
                content: '刷新失败'
              })
              this.refreshing = false
            })
        } else {
          this.refreshing = false
        }
      },
      fetchBusLineData: async function (lineId, lineName, fromStation) {
        const res2 = await service.getStationListByLineId(lineId)
        const stations = res2.data.data.map(v => {
          v.Lat = TO_GLAT(v.Lat)
          v.Lng = TO_GLNG(v.Lng)
          return v
        })
        const res3 = await service.getRealTimeStatusByLineNameAndHeadStation(lineName, fromStation)
        const realTimes = res3.data.data || []
        return {
          stations,
          realTimes,
          lineId,
          lineName,
          fromStation
        }
      },
      drawBusLine (data) {
        const stations = data.stations
        // 线路
        const pointList = stations.map(v => new L.LatLng(v.Lat, v.Lng))
        const polyline = new L.Polyline(pointList, {
          color: '#398bfc',
          weight: 2,
          opacity: 0.5,
          smoothFactor: 1
        })
        polyline.addTo(this.map)
        // 站点
        stations.forEach((station, index) => {
          if (index === 0) {
            L.marker([station.Lat, station.Lng], {
              icon: lineStartIcon
            })
              .addTo(this.map)
              .bindPopup(`起点：${station.Name}`)
          } else if (index === stations.length - 1) {
            L.marker([station.Lat, station.Lng], {
              icon: lineEndIcon
            })
              .addTo(this.map)
              .bindPopup(`终点：${station.Name}`)
          } else {
            L
              .circle([station.Lat, station.Lng], {
                radius: 20,
                color: '#398bfc'
              })
              .addTo(this.map)
              .bindPopup(`${station.Name}`)
          }
        })
        // 实时
        const realTimes = data.realTimes
        realTimes.forEach(v => {
          const stationIndex = findIndex(stations, {Name: v.CurrentStation})
          if (stationIndex >= 0) {
            let lat, lng
            if (v.LastPosition === '8') {
              const station = stations[stationIndex]
              lat = station.Lat
              lng = station.Lng
            } else if (stationIndex < stations.length - 2 && v.LastPosition === '5') {
              const station = stations[stationIndex]
              const stationNext = stations[stationIndex + 1]
              lat = (station.Lat + stationNext.Lat) / 2
              lng = (station.Lng + stationNext.Lng) / 2
            }
            L
              .marker([lat, lng])
              .addTo(this.map)
              .bindPopup(`${data.lineName} ${v.BusNumber}`)
          }
        })
      }
    }
  }
</script>

<style scoped lang="less">
  .map-container {
    display: block;
    position: fixed;
    height: auto;
    bottom: 0;
    top: 0;
    left: 0;
    right: 0;
    margin-top: 50px;

    #map {
      height: 100%;
    }

    .refresh-btn {
      position: absolute;
      bottom: 25px;
      right: 10px;
      z-index: 99999;

      .btn {
        width: 55px;
      }
    }
  }
</style>
