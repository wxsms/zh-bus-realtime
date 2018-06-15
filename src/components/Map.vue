<template>
  <div class="map-container">
    <div id="map"></div>
    <div class="refresh-btn" v-show="lines && lines.length">
      <btn @click="refreshMap" :disabled="refreshing">
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

  export default {
    props: ['lines'],
    data () {
      return {
        map: null,
        tileLayer: null,
        userPointLayer: null,
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
      this.refreshMap()
      this.map.on('click', function (e) {
        // console.log('Lat, Lon : ' + e.latlng.lat + ', ' + e.latlng.lng)
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
      drawTile () {
        /*this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map)*/
        this.tileLayer = L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
          subdomains: ['1', '2', '3', '4'], //可用子域名，用于浏览器并发请求
          attribution: '&copy; 高德地图',
        }).addTo(this.map)
      },
      locateUser () {
        try {
          this.map.removeLayer(this.userPointLayer)
        } catch (e) {
          // ignore
        }
        this.map.on('locationfound', (e) => {
          const radius = e.accuracy / 2
          this.userPointLayer = L.layerGroup([
            L.marker([TO_GLAT(e.latlng.lat), TO_GLNG(e.latlng.lng)]).bindPopup('我的位置').openPopup(),
            L.circle([TO_GLAT(e.latlng.lat), TO_GLNG(e.latlng.lng)], radius)
          ]).addTo(this.map)
        })
        this.map.on('locationerror', (e) => {
          console.log(e.message)
        })
        this.map.locate({setView: true, maxZoom: 16})
      },
      clearMap () {
        this.map.eachLayer((layer) => {
          if (layer !== this.userPointLayer && layer !== this.tileLayer) {
            this.map.removeLayer(layer)
          }
        })
      },
      refreshMap () {
        this.refreshing = true
        this.clearMap()
        if (Array.isArray(this.lines)) {
          const promises = []
          this.lines.forEach(line => {
            promises.push(this.drawBusLine(line.id, line.name, line.fromStation))
          })
          Promise
            .all(promises)
            .then(() => {
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
      drawBusLine: async function (lineId, lineName, fromStation) {
        const res2 = await service.getStationListByLineId(lineId)
        const stations = res2.data.data.map(v => {
          v.Lat = TO_GLAT(v.Lat)
          v.Lng = TO_GLNG(v.Lng)
          return v
        })
        // 线路
        const pointList = stations.map(v => new L.LatLng(v.Lat, v.Lng))
        const polyline = new L.Polyline(pointList, {
          color: '#398bfc',
          weight: 2,
          opacity: 0.5,
          smoothFactor: 1
        })
        polyline.addTo(this.map)
        this.map.fitBounds(pointList)
        // 站点
        stations.forEach(v => {
          L
            .circle([v.Lat, v.Lng], {
              radius: 20,
              color: '#398bfc'
            })
            .addTo(this.map)
            .bindPopup(`${v.Name}`)
        })
        // 实时
        const res3 = await service.getRealTimeStatusByLineNameAndHeadStation(lineName, fromStation)
        const realTimes = res3.data.data || []
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
              .bindPopup(`${lineName} ${v.BusNumber}`)
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
