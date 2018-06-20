// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'bootstrap/dist/css/bootstrap.min.css'
import 'leaflet/dist/leaflet.css'
import Vue from 'vue'
import App from './App'
import axios from 'axios'
import * as uiv from 'uiv'
import locale from 'uiv/src/locale/lang/zh-CN'

Vue.use(uiv, {locale})
Vue.config.productionTip = false
Vue.prototype.$http = axios

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: {App},
  template: '<App/>'
})
