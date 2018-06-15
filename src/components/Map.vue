<template>
  <div class="map-container">
    <div id="map"></div>
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

  const busStationIcon = L.icon({
    iconUrl: '/static/bus-station.png',
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
        userCircleLayer: null
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
      this.locateUser()
      if (Array.isArray(this.lines)) {
        this.lines.forEach(line => {
          this.drawBusLine(line.id, line.name, line.fromStation)
        })
      }
      this.map.on('click', function (e) {
        console.log('Lat, Lon : ' + e.latlng.lat + ', ' + e.latlng.lng)
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
          this.map.removeLayer(this.userCircleLayer)
        } catch (e) {
          // ignore
        }
        this.map.on('locationfound', (e) => {
          const radius = e.accuracy / 2
          this.userPointLayer = L.marker([TO_GLAT(e.latlng.lat), TO_GLNG(e.latlng.lng)]).addTo(this.map)
            .bindPopup('我的位置').openPopup()
          this.userCircleLayer = L.circle([TO_GLAT(e.latlng.lat), TO_GLNG(e.latlng.lng)], radius).addTo(this.map)
        })
        this.map.on('locationerror', (e) => {
          console.log(e.message)
        })
        this.map.locate({setView: true, maxZoom: 16})
      },
      clearMap () {
        this.map.eachLayer((layer) => {
          if (layer !== this.userPointLayer && layer !== this.userCircleLayer && layer !== this.tileLayer) {
            this.map.removeLayer(layer)
          }
        })
      },
      drawBusLine: async function (lineId, lineName, fromStation) {
        const res2 = await service.getStationListByLineId(lineId)
        const stations = res2.data.data.map(v => {
          v.Lat = TO_GLAT(v.Lat)
          v.Lng = TO_GLNG(v.Lng)
          return v
        })
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
              const lat = (station.Lat + stationNext.Lat) / 2
              const lng = (station.Lng + stationNext.Lng) / 2
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
