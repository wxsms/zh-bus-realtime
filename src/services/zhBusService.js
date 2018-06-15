import axios from 'axios'

export function getStationListByLineId (lineId) {
  return axios.get(`/api/zhbus/StationList/GetStationList?id=${lineId}`)
}

export function getLineDetailByName (lineName) {
  return axios.get(`/api/zhbus/Handlers/BusQuery.ashx?handlerName=GetLineListByLineName&key=${lineName}`)
}

export function getRealTimeStatusByLineNameAndHeadStation (lineName, headStation) {
  return axios.get(`/api/zhbus/RealTime/GetRealTime?id=${lineName}&fromStation=${headStation}`)
}
