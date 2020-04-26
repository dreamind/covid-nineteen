<template>
  <div id="app">
    <div id="logo"></div>
    <div class="app-header">
      <div :style="columnWidthStyle(index)" :key="index" v-for="(column, index) in columns">
        <div v-if="index === 0" class="mode-select">
          <span
            class="symbol"
            :data-select="snapshotMode === SNAPSHOT_BOTH"
            title="Total &amp; New Cases"
            @click="setSnapshotMode(SNAPSHOT_BOTH)"
          >
            ∑<span class="ampersand">&</span>Δ<!-- this must be in the same line -->
          </span>
          <span
            class="symbol"
            :data-select="snapshotMode === SNAPSHOT_TOTAL"
            title="Total Cases"
            @click="setSnapshotMode(SNAPSHOT_TOTAL)"
          >
            ∑
          </span>
          <span
            class="symbol"
            :data-select="snapshotMode === SNAPSHOT_CHANGE"
            title="New Cases (daily)"
            @click="setSnapshotMode(SNAPSHOT_CHANGE)"
          >
            Δ
          </span>
        </div>
        <div v-else class="indicator">
          <div class="numbers">
            <span :class="column.field">{{ nFormat(currents[column.field]) }}</span>
            <span class="divider"></span>
            <span :class="column.dField">{{ dFormat(currents[column.dField]) }}</span>
          </div>
          <div class="heading">{{ column.title }} Cases</div>
        </div>
      </div>
      <div class="indicator date">
        <div class="human-date">{{ humanDate }}</div>
        <div class="heading">as {{ distDate }}</div>
      </div>
      <div class="mode-select">
        <span
          class="symbol"
          :data-select="timeseriesMode === TIMESERIES_COMBINED"
          title="Combined"
          @click="setTimeseriesMode(TIMESERIES_COMBINED)"
        >
          +
        </span>
        <span
          class="symbol"
          :data-select="timeseriesMode === TIMESERIES_COMPARED"
          title="Compared"
          @click="setTimeseriesMode(TIMESERIES_COMPARED)"
        >
          ÷
        </span>
        <span
          class="symbol"
          :data-select="timeseriesMode === TIMESERIES_BOTH"
          title="Both"
          @click="setTimeseriesMode(TIMESERIES_BOTH)"
        >
          +<span class="ampersand">&</span>÷<!-- this must be in the same line -->
        </span>
      </div>
      <div class="countries">
        <span
          class="country"
          :key="country"
          :style="{ 'background-color': palette[idx] }"
          v-for="(country, idx) in currentCountries"
        >
          {{ country }}
        </span>
      </div>
    </div>
    <div class="app-body">
      <Grid
        id="grid"
        :mode="snapshotMode"
        @change="gridChange"
        @resetCountries="resetCountries"
        @toggleCountry="toggleCountry"
      />
      <div id="charts-wrapper" class="scrolled">
        <div id="charts">
          <Chart
            title="Total Confirmed"
            :selectedMeasures="['deceased', 'recovered', 'active']"
            :height="130"
            :width="chartWidth"
            :mode="timeseriesMode"
            :focusDateIdx="focusDateIdx"
            :initialChartWidth="initialChartWidth"
            @selectDate="selectDate"
          />
          <Chart
            title="Daily Confirmed"
            :selectedMeasures="['dConfirmed']"
            :height="70"
            :width="chartWidth"
            :mode="timeseriesMode"
            :focusDateIdx="focusDateIdx"
            :initialChartWidth="initialChartWidth"
            @selectDate="selectDate"
          />          
          <Chart
            title="Daily Deceased"
            :selectedMeasures="['dDeceased']"
            :height="70"
            :width="chartWidth"
            :mode="timeseriesMode"
            :focusDateIdx="focusDateIdx"
            :initialChartWidth="initialChartWidth"
            @selectDate="selectDate"
          />
          <Chart
            title="Daily Recovered"
            :selectedMeasures="['dRecovered']"
            :height="70"
            :width="chartWidth"
            :mode="timeseriesMode"
            :focusDateIdx="focusDateIdx"
            :initialChartWidth="initialChartWidth"
            @selectDate="selectDate"
          />
          <Chart
            title="Daily Active"
            :selectedMeasures="['dActive']"
            :height="70"
            :width="chartWidth"
            :mode="timeseriesMode"
            :focusDateIdx="focusDateIdx"
            :initialChartWidth="initialChartWidth"
            @selectDate="selectDate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Grid from "./components/Grid.vue";
import Chart from "./components/Chart.vue";
import { assign, each, without, union } from "lodash";
import moment from "moment";
import { mixin as columnMixin } from "./mixins/columns";
import { dates } from "../public/data/summary.json";
import {
  dateMap,
  fields,
  measures,
  modeHeadingMap,
  sorterMap,
  columns,
  nFormat,
  dFormat,
  palette,
  SNAPSHOT_BOTH,
  SNAPSHOT_TOTAL,
  SNAPSHOT_CHANGE,
  TIMESERIES_COMBINED,
  TIMESERIES_COMPARED,
  TIMESERIES_BOTH
} from "./libs/common";

export default {
  name: "App",
  mixins: [columnMixin],
  components: {
    Grid,
    Chart
  },
  data() {
    return {
      palette,
      SNAPSHOT_BOTH,
      SNAPSHOT_TOTAL,
      SNAPSHOT_CHANGE,
      TIMESERIES_COMBINED,
      TIMESERIES_COMPARED,
      TIMESERIES_BOTH,
      humanDate: "",
      distDate: "",
      columns,
      chartWidth: 700,
      snapshotMode: 0,
      timeseriesMode: 0,
      selectedCountries: [],
      initialChartWidth: 0,
      colWidths: [],
      focusDateIdx: null,
      currents: {
        confirmed: 0,
        dConfirmed: 0,
        deceased: 0,
        dDeceased: 0,
        recovered: 0,
        dRecovered: 0,
        active: 0,
        dActive: 0
      }
    };
  },
  computed: {
    ...mapGetters(["rows", "rowStats", "series", "totalStats", "currentDate", "currentCountries"])
  },
  async created() {
    this.initialChartWidth = screen.width - 20 - 700;
    await this.$store.dispatch("pull");
    this.$store.dispatch("getSnapshot");
    this.$store.dispatch("getTimeseries");
  },
  watch: {
    currentDate() {
      this.updateCurrentDate();
      this.updateMainStats();
    }
  },
  mounted() {},
  methods: {
    selectDate(date, state, dateIndex) {
      // dataIndex is undefined
      if (state === 2) {
        this.$store.dispatch("getSnapshot", date, dateIndex);
      } else if (state === 0) {
        this.$store.dispatch("getSnapshot");
      } else if (state === -1) {
        this.focusDateIdx = -1;
      } else {
        // 1 (hover)
        this.focusDateIdx = dateIndex;
      }
    },
    setTimeseriesMode(mode) {
      this.timeseriesMode = mode;
    },
    setSnapshotMode(mode) {
      this.snapshotMode = mode;
    },
    updateCurrentDate() {
      let m = moment(this.currentDate);
      this.humanDate = m.format("ddd, D MMM YY");
      let distDate = moment.duration(m.diff(moment().format("YYYY-MM-DD"))).asDays();
      if (distDate === 0) {
        distDate = "today";
      } else {
        distDate = moment.duration(-Math.abs(distDate), "days").humanize(true);
      }
      this.distDate = distDate;
    },
    updateMainStats() {
      each(this.currents, (v, field) => {
        this.currents[field] = this.totalStats[field];
      });
    },
    nFormat,
    dFormat,
    gridChange(stats) {},
    resetCountries() {
      this.$store.dispatch("updateCountries", null);
    },
    toggleCountry(country) {
      this.$store.dispatch("updateCountries", country);
    }
  }
};
</script>

<style lang="stylus">
@import 'assets/styles/common'

div
  box-sizing: border-box

#app
  margin: auto
  padding: 0
  font-family: 'Libre Franklin', sans-serif
  font-family: 'Roboto Condensed', sans-serif
  font-weight: 200
  font-size: 12px
  position: absolute
  overflow: hidden
  left: 10px
  top: 10px
  right: 10px
  bottom: 15px
  display: flex
  flex-direction: column
  align-items: stretch

#logo
  background-image url('./assets/images/sars-cov-2.png')
  background-size 150% 150%
  background-position -18px -18px
  background-repeat no-repeat;
  width 30px
  height 30px
  position fixed
  top 0
  left 0


.app-body
  max-height: calc(100% - 39px)
  position relative
  flex: 1 1 auto
  display: flex
  flex-direction: row
  align-items: stretch

.app-header
  flex: 0 0 auto
  display: flex
  flex-direction: row
  align-items: flex-end
  padding-left: 12px

  > div
    flex: 0 0 auto

  .indicator
    display: flex
    padding: 3px
    flex-direction: column
    align-items: center

    &.date
      margin: 0 10px
      align-items: center
      width: 120px

    .human-date
      font-size: 16px
      font-weight: 700
      color: #ff9900

    .heading
      color: #707070
      font-size: 16px
      font-weight: 400
      font-family: 'Slabo 27px'

    .numbers
      font-size: 16px
      padding: 0 0 0 0

      & > span
        font-weight: 700

        &:first-child
          border-right: 1px solid #e0e0e0
          padding-right: 5px

        &:nth-child(2)
          padding-left: 5px

  .countries
    padding: 2px 0 0 0
    display: flex
    flex-direction: row
    flex-wrap: wrap
    justify-content: flex-start
    align-items: flex-start
    align-content: flex-start
    align-self: flex-start
    margin-left: 20px
    flex: 1 1 auto

    .country
      display: inline-block
      padding: 1px 3px
      margin: 0 3px 3px 0
      // color: #ff6600
      // border: 1px solid $c-line-normal
      border-radius: 3px
      color: white
      font-weight: 400
      font-size: 10px

.mode-select
  padding-bottom: 8px
  display: flex
  flex-direction: row

  .symbol
    border-bottom: 1px solid $c-line-normal

    &[data-select='true']
      border-bottom: 1px solid $c-line-select

#grid
  flex: 0 0 auto

#charts-wrapper
  overflow-x auto
  overflow-y auto
  position absolute
  top 0
  left 710px
  bottom 0
  right 0

  #charts
    .chart:first-child
      margin-top: 0


.numbers .confirmed
  color: $c-confirmed

.numbers .dConfirmed
  color: darken($c-confirmed, 30%)

.numbers .deceased
  color: $c-deceased

.numbers .dDeceased
  color: darken($c-deceased, 30%)

.numbers .recovered
  color: $c-recovered

.numbers .dRecovered
  color: darken($c-recovered, 30%)

.numbers .active
  color: $c-active

.numbers .dActive
  color: darken($c-active, 20%)
</style>
