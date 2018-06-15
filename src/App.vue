<template>
  <div id="app">
    <Map :lines="lines"/>
    <div class="gui">
      <div class="input-box">
        <input id="input" ref="input" class="form-control" type="text" placeholder="Type to search...">
        <typeahead
          force-select
          v-model="selectedLine"
          target="#input"
          item-key="Name"
          :async-function="queryFunction">
          <template slot="item" slot-scope="props">
            <li v-for="(item, index) in props.items" :class="{active:props.activeIndex===index}">
              <a role="button" @click="props.select(item)">
                <span v-html="props.highlight(item)"></span>
                <small>
                  <span>[{{item.FromStation}}</span>
                  <span>&gt;</span>
                  <span>{{item.ToStation}}]</span>
                </small>
              </a>
            </li>
          </template>
        </typeahead>
      </div>
      <div class="menu-box">
        <dropdown ref="dropdown" menu-right>
          <btn type="primary" class="dropdown-toggle">已选线路（{{lines.length}}条） <span class="caret"></span></btn>
          <template slot="dropdown">
            <li v-for="(line,index) in lines" @click="removeLine(index)">
              <a role="button">
                <span>{{line.name}}</span>
                <small>
                  <span>[{{line.fromStation}}</span>
                  <span>&gt;</span>
                  <span>{{line.toStation}}]</span>
                </small>
                <span class="glyphicon glyphicon-remove"></span>
              </a>
            </li>
            <li v-if="lines.length === 0" class="disabled">
              <a role="button">暂无数据</a>
            </li>
          </template>
        </dropdown>
      </div>
    </div>
  </div>
</template>

<script>
  import Map from './components/Map.vue'
  import * as service from './services/zhBusService'
  import findIndex from 'lodash/findIndex'

  export default {
    components: {Map},
    data () {
      return {
        selectedLine: null,
        lines: []
      }
    },
    watch: {
      selectedLine (v) {
        if (v) {
          const lineId = v.Id
          const index = findIndex(this.lines, {id: lineId})
          if (index >= 0) {
            this.$notify('该线路在列表中已存在')
          } else {
            this.lines.push({
              id: v.Id,
              name: v.Name,
              fromStation: v.FromStation,
              toStation: v.ToStation
            })
          }
          this.$nextTick(() => {
            this.selectedLine = null
            this.$refs.input.value = ''
          })
        }
      }
    },
    methods: {
      queryFunction (query, done) {
        service.getLineDetailByName(query)
          .then(res => {
            done(res.data.data)
          })
          .catch(err => {
            console.error(err)
          })
      },
      removeLine (index) {
        this.lines.splice(index, 1)
      }
    }
  }
</script>

<style lang="less">
  body > .alert {
    z-index: 9999;
  }

  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    width: 100vw;
    height: 100vh;
  }

  .gui {
    z-index: 9998;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #eee;
    height: 50px;
    padding: 10px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    overflow: visible;

    .input-box {
      flex: 1
    }

    .menu-box {
      margin-left: 15px
    }
  }
</style>
