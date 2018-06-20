<template>
  <div id="app">
    <Map :lines="lines"/>
    <div class="gui">
      <div class="input-box">
        <input id="input" ref="input" class="form-control" type="text" placeholder="输入线路...">
        <div class="loading-icon" v-show="loading">
          <loading-icon/>
        </div>
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
          <btn type="primary" class="dropdown-toggle">已选 ({{lines.length}})<span class="caret"></span></btn>
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
        <btn-group>
          <btn @click="showSaveModal">
            <span class="glyphicon glyphicon-floppy-save"></span>
          </btn>
          <btn @click="showLoadModal">
            <span class="glyphicon glyphicon-floppy-open"></span>
          </btn>
        </btn-group>
      </div>
    </div>
    <modal v-model="saveModalVisible" title="保存当前方案">
      <div>
        <input ref="input" class="form-control" type="text" placeholder="输入方案名..." v-model="saveName">
      </div>
      <br/>
      <h5>方案内容：</h5>
      <ol>
        <li v-for="line in lines">
          <span>{{line.name}}</span>
          <small>
            <span>[{{line.fromStation}}</span>
            <span>&gt;</span>
            <span>{{line.toStation}}]</span>
          </small>
        </li>
      </ol>
      <div slot="footer">
        <btn @click="saveModalVisible=false">取消</btn>
        <btn type="primary" @click="onSaveSubmit">确认</btn>
      </div>
    </modal>
    <modal v-model="loadModalVisible" title="读取方案" :footer="false">
      <div class="text-center" v-if="saved.length === 0">
        （暂无数据）
      </div>
      <div v-else>
        <h5>直接点击预设方案即可读取</h5>
        <div>
          <btn-group vertical style="width: 100%">
            <btn :type="index%2===0?'info':'primary'" v-for="(savedLines,index) in saved"
                 @click="loadSavedLine(savedLines)">
              {{savedLines.name}}
            </btn>
          </btn-group>
        </div>
        <br/>
        <btn block type="danger" @click="clearSaved">清除方案数据</btn>
      </div>
    </modal>
  </div>
</template>

<script>
  import Map from './components/Map.vue'
  import * as service from './services/zhBusService'
  import findIndex from 'lodash/findIndex'
  import LoadingIcon from './components/LoadingIcon.vue'

  export default {
    components: {Map, LoadingIcon},
    data () {
      return {
        loading: false,
        selectedLine: null,
        lines: [],
        saveModalVisible: false,
        loadModalVisible: false,
        saveName: '',
        saved: []
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
        this.loading = true
        service.getLineDetailByName(query)
          .then(res => {
            this.loading = false
            done(res.data.data)
          })
          .catch(err => {
            this.loading = false
            console.error(err)
          })
      },
      removeLine (index) {
        this.lines.splice(index, 1)
      },
      showSaveModal () {
        if (typeof window.localStorage === 'undefined') {
          this.$notify({
            type: 'warning',
            content: '浏览器不支持 LocalStorage，无法保存方案'
          })
          return
        }
        if (this.lines && this.lines.length > 0) {
          this.saveModalVisible = true
          this.saveName = ''
        } else {
          this.$notify({
            type: 'info',
            content: '要保存方案，请先选择至少一条线路'
          })
        }
      },
      showLoadModal () {
        if (typeof window.localStorage === 'undefined') {
          this.$notify({
            type: 'warning',
            content: '浏览器不支持 LocalStorage，无法读取方案'
          })
          return
        }
        const saved = localStorage.getItem('saved')
        this.saved = saved ? JSON.parse(saved) : []
        this.loadModalVisible = true
      },
      onSaveSubmit () {
        if (this.saveName === '') {
          this.$notify({
            type: 'info',
            content: '请输入方案名'
          })
          return
        }
        const saved = localStorage.getItem('saved')
        const savedArr = saved ? JSON.parse(saved) : []
        savedArr.push({
          name: this.saveName,
          data: this.lines
        })
        localStorage.setItem('saved', JSON.stringify(savedArr))
        this.saveModalVisible = false
        this.$notify({
          type: 'success',
          content: '方案已保存'
        })
      },
      loadSavedLine (savedLines) {
        this.lines = savedLines.data
        this.loadModalVisible = false
      },
      clearSaved () {
        localStorage.removeItem('saved')
        this.loadModalVisible = false
        this.$notify({
          type: 'success',
          content: '方案数据已清除'
        })
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
    z-index: 1000;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f0f0f0;
    height: 50px;
    padding: 10px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    overflow: visible;
    box-shadow: 0 4px 10px -5px #000;

    .input-box {
      flex: 1;
      position: relative;
    }

    .loading-icon {
      position: absolute;
      top: 6.5px;
      right: 5px;
    }

    .menu-box {
      margin-left: 15px
    }
  }
</style>
