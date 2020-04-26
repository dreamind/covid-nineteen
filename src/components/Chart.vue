<template>
  <div class="chart">
    <div class="header">
      <span class="vertical" :style="{ width: `${effectiveHeight}px` }">{{ title }}</span>
    </div>
    <svg class="chart-svg" :width="effectiveWidth + 'px'" :height="`${effectiveHeight}px`">
      <g :key="'grid-' + idx" v-for="(grid, idx) in gridY">
        <path class="grid" :d="grid.d" />
        <text :x="`${widthX + 3}`" :y="`${grid.y}`">{{ grid.v }}</text>
      </g>
      <g v-for="({ x, date, stacks, month, tick, highlight }, index) in bars" :key="index">
        <g
          @mouseover="tipOn(index, $event)"
          @mouseout="tipOff(index, $event)"
          @click="selectBar(index, $event)"
        >
          <rect
            :data-index="index"
            class="base"
            :class="'hi-' + highlight"
            fill="transparent"
            :x="x"
            :y="0"
            :width="barWidth"
            :height="maxY"
          />
          <!-- filler -->
          <rect fill="transparent" :x="x + barWidth" :y="0" :width="1" :height="maxY" />
        </g>
        <rect
          :key="'r-' + measure"
          class="bar"
          :class="measure"
          :data-negative="stacks[measure].v < 0"
          :x="x"
          :y="stacks[measure].y"
          :width="stacks[measure].w"
          :height="stacks[measure].h"
          v-for="measure in selectedMeasures"
          :opacity="showLines ? 0.2 : 1.0"
          v-show="showBars"
        />
        <!-- <circle
          :key="'c-' + measure"
          class="point"
          :class="measure"
          fill="transparent"
          :cx="x + barWidth / 2"
          :cy="stacks[measure].y"
          :r="2"
          v-for="measure in selectedMeasures"
        />-->
      </g>
      <g v-for="({ x, date, month, tick }, index) in bars" :key="'tick-' + index">
        <line
          class="tickMonth"
          v-if="month"
          :x1="`${x + barWidth / 2}px`"
          :y1="`${maxY}px`"
          :x2="`${x + barWidth / 2}px`"
          :y2="`${dateY - 9}px`"
        />
        <text
          v-if="month"
          :x="`${x + barWidth / 2}px`"
          :y="`${dateY}px`"
          width="100px"
          style="text-anchor: middle;"
        >
          {{ month }}
        </text>
        <line
          v-if="tick"
          class="tick"
          :x1="`${x + barWidth / 2}px`"
          :y1="`${maxY}px`"
          :x2="`${x + barWidth / 2}px`"
          :y2="`${maxY + 4}px`"
        />
      </g>
      <path class="line" :d="path" v-show="false" />
      <path
        class="line"
        :d="path.d"
        :stroke="path.color"
        :key="'country-path-' + idx"
        v-for="(path, idx) in countryPaths"
        v-show="showLines"
      />
    </svg>
    <div class="tip" v-show="isTipping" :style="tipStyle" v-html="tipContent"></div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import moment from "moment";
import { reduce, each, last, max } from "lodash";
import {
  measures,
  calcGridInterval,
  columnMap,
  nFormat,
  dFormat,
  sFormat,
  palette,
  TIMESERIES_COMBINED,
  TIMESERIES_COMPARED,
  TIMESERIES_BOTH
} from "../libs/common";

export default {
  name: "Chart",
  props: {
    countriesSelected: Array,
    selectedMeasures: Array,
    title: String,
    height: Number,
    width: Number,
    mode: Number,
    initialChartWidth: Number,
    focusDateIdx: Number
  },
  data() {
    return {
      tickLength: 3,
      dateLabelHeight: 10,
      dateLabelGap: 12,
      dateY: 0,
      ox: 0,
      oy: 10,
      barWidth: 0,
      dateRange: [],
      dateNum: 0,
      bars: [],
      path: "",
      countryPaths: [],
      gridY: [],
      widthX: 0,
      minX: 0,
      maxX: 30000,
      zeroY: 0,
      minY: 0,
      maxY: 30000,
      minV: 0,
      maxV: 0,
      rangeV: 0,
      isTipping: false,
      tipStyle: {},
      tipWidth: 60,
      tipContent: "",
      tipCache: {},
      showLines: false,
      showBars: true,
      effectiveWidth: 0,
      effectiveHeight: 0,
      tipTimeout: null
    };
  },
  mounted() {},
  computed: {
    ...mapGetters([
      "dates",
      "series",
      "seriesStats",
      "currentDate",
      "currentDateIdx",
      "currentCountries"
    ])
  },
  methods: {
    selectBar(index, event) {
      let rect = event.target;
      let bar = this.bars[index];
      let state;
      let { stacks, date, dateIndex, highlight } = bar;
      if (highlight !== 2) {
        state = 2;
      } else {
        state = 0;
      }
      this.$emit("selectDate", date, state);
    },
    tipOn(index, event) {
      let { barWidth, bars, selectedMeasures, oy, ox } = this;
      let bar = bars[index];
      let { stacks, dateTip, date, dateIndex } = bar;
      let rect = event.target;
      let svg = rect.parentElement.parentElement;
      let tipCache = this.tipCache[index];
      let { tipStyle, tipContent } = tipCache ? tipCache : {};

      this.$emit("selectDate", date, 1, dateIndex);
      if (!tipCache) {
        let x = parseInt(rect.getAttribute("x"));
        let y = parseInt(rect.getAttribute("y"));
        tipStyle = {
          left: `${x + barWidth + ox + 27}px`,
          top: `${oy}px`
        };
        tipContent = dateTip + "<br />";
        each(selectedMeasures, measure => {
          let v = stacks[measure].v;
          if (measure.startsWith("d")) {
            v = dFormat(v);
          } else {
            v = nFormat(v);
          }
          tipContent += `${columnMap[measure].symbol} ${v}<br />`;
        });
        this.tipCache[index] = {
          tipContent,
          tipStyle
        };
      }
      this.tipStyle = tipStyle;
      this.tipContent = tipContent;
      this.isTipping = true;
      // if (this.tipTimeout) {
      //   clearTimeout(this.tipTimeout)
      // }
    },
    tipOff(index, event) {
      let me = this;
      let bar = this.bars[index];
      this.$emit("selectDate", bar.date, -1, bar.dateIndex);
      me.isTipping = false;
      // this.tipTimeout = setTimeout(function () {
      //   me.isTipping = false;
      // }, 100)
    },
    calcContext() {
      let {
        oy,
        width,
        height,
        tickLength,
        dates,
        currentCountries,
        dateLabelGap,
        selectedMeasures,
        seriesStats,
        tipWidth,
        mode
      } = this;
      let maxV = 0;
      let minV = 0;
      let singleMinV = 0;
      let singleMaxV = 0;
      each(selectedMeasures, measure => {
        let { maxSum, minSum, max, min } = seriesStats[measure];
        maxV += maxSum;
        minV += minSum;
        singleMaxV += max;
        singleMinV += min;
      });
      if (mode === TIMESERIES_COMPARED && currentCountries.length) {
        minV = singleMinV;
        maxV = singleMaxV;
      } else if (mode === TIMESERIES_BOTH && currentCountries.length) {
        if (singleMinV < minV) {
          minV = singleMinV;
        }
        if (singleMaxV > maxV) {
          maxV = singleMaxV;
        }
      }
      if (maxV < 0) {
        maxV = 0;
      }
      let rangeV = maxV - minV;
      this.zeroY = oy + Math.ceil((maxV * height) / rangeV);
      this.maxV = maxV;
      this.minV = minV;
      this.rangeV = rangeV;

      this.minY = oy;
      this.maxY = oy + height;
      this.dateY = oy + height + tickLength + dateLabelGap;
      this.dateRange = dates;
      let dateNum = dates.length;
      this.dateNum = dateNum;

      width = this.initialChartWidth;
      let barWidth = Math.floor((width - tipWidth) / dateNum);
      if (barWidth % 2 !== 0) {
        // make sure it's even number
        barWidth -= 1;
      }
      if (barWidth < 6) {
        // minumum bar width, including 1-pixel gap
        barWidth = 6;
      }
      this.widthX = dateNum * barWidth;
      barWidth -= 1; // 1-pixel gap, make sure it's odd
      this.barWidth = barWidth;
      this.effectiveWidth = this.widthX + tipWidth;
      this.effectiveHeight = this.dateY + this.dateLabelHeight;
    },
    calcGrid() {
      let { ox, oy, height, widthX, selectedMeasures, maxV, minV } = this;
      let measure = "confirmed";
      if (selectedMeasures.length === 1) {
        measure = selectedMeasures[0];
      }
      let interval = calcGridInterval(max([Math.abs(maxV), Math.abs(minV)]));
      let start = Math.ceil(minV / interval);
      let v = start < 0 ? start * interval : 0;
      let gridY = [];
      do {
        let y = this.zeroY - this.mapVtoH(v, measure);
        gridY.push({
          v: sFormat(v),
          y,
          d: `M${ox} ${y} L${widthX} ${y}`
        });
        v += interval;
      } while (v < maxV);
      this.gridY = gridY;
    },
    mapVtoH(v, measure) {
      const { height, rangeV } = this;
      const useSemiLog = false; //selectedMeasures.length > 1;
      let h = Math.ceil((v * height) / rangeV);
      if (useSemiLog && measure) {
        let maxSum = this.seriesStats[measure].maxSum;
        h = Math.ceil((Math.log10(v + 1) * height * maxSum) / (rangeV * Math.log10(maxSum + 1)));
      }
      return h;
    },
    calcBars() {
      const { height, barWidth, ox, oy, selectedMeasures, dates, currentCountries, maxV } = this;
      let x = ox;
      const bars = [];
      let path = "";
      const lastMeasure = last(selectedMeasures);
      const countryPaths = {};

      each(currentCountries, (country, i) => {
        countryPaths[country] = {
          d: "",
          color: palette[i % palette.length]
        };
      });

      each(dates, (date, index) => {
        let y = this.zeroY;
        const stacks = {};

        const m = moment(date);
        const dateOfMonth = m.date();
        const dayOfWeek = m.day();
        const dateTip = m.format("D MMM");
        let month = null;
        let tick = false;

        if (dateOfMonth === 1) {
          month = m.format("MMM");
        }
        if (dayOfWeek === 1) {
          // Monday
          tick = true;
        }
        each(selectedMeasures, measure => {
          const v = this.series[index].sum[measure];
          let h = this.mapVtoH(v, measure);
          y -= h;
          stacks[measure] = {
            x,
            y: h < 0 ? this.zeroY : y,
            w: barWidth,
            h: Math.abs(h),
            v,
            date
          };
        });
        // construct bar
        const bar = {
          dateTip,
          date,
          dateIndex: index,
          x,
          stacks,
          month,
          tick,
          highlight: 0 // 1 = hover, 2 = selected
        };
        bars.push(bar);

        // construct path
        let px = x + barWidth / 2;
        let py = stacks[lastMeasure].y;
        if (index === 0) {
          path = `M${px} ${py} `;
        } else {
          path += `L${px} ${py} `;
        }

        let countries = this.series[index].countries;
        if (index === 0) {
          each(currentCountries, country => {
            let row = countries[country];
            py = this.zeroY - this.mapVtoH(row[lastMeasure]);
            countryPaths[country].d += `M${px} ${py} `;
          });
        } else {
          each(currentCountries, country => {
            let row = countries[country];
            py = this.zeroY - this.mapVtoH(row[lastMeasure]);
            countryPaths[country].d += `L${px} ${py} `;
          });
        }
        x += barWidth + 1;
      });
      this.path = path;
      this.bars = bars;
      this.countryPaths = countryPaths;
    },
    refresh() {
      this.calcContext();
      this.calcBars();
      this.calcGrid();
      this.updateForCurrentDate();
    },
    updateMode() {
      if (this.currentCountries.length === 0) {
        this.showLines = false;
        this.showBars = true;
        return;
      }
      switch (this.mode) {
        case TIMESERIES_COMBINED:
          this.showLines = false;
          this.showBars = true;
          break;
        case TIMESERIES_COMPARED:
          this.showLines = true;
          this.showBars = false;
          // code block
          break;
        default:
          // TIMESERIES_BOTH
          this.showLines = true;
          this.showBars = true;
      }
    },
    updateForCurrentDate() {
      each(this.bars, bar => {
        if (bar.date === this.currentDate) {
          this.$set(bar, "highlight", 2);
        } else if (bar.highlight === 2) {
          this.$set(bar, "highlight", 0);
        } // keep highlight = 1 (hover) as it is
      });
    }
  },
  watch: {
    focusDateIdx(newDateIdx, oldDateIdx) {
      // hover
      let bar;
      if (oldDateIdx > 0) {
        bar = this.bars[oldDateIdx];
        if (bar.highlight !== 2) {
          this.$set(bar, "highlight", 0);
        }
      }
      if (newDateIdx > 0) {
        bar = this.bars[newDateIdx];
        if (bar.highlight !== 2) {
          this.$set(bar, "highlight", 1);
        }
      }
    },
    currentDate() {
      this.updateForCurrentDate();
    },
    seriesStats() {
      this.refresh();
    },
    mode() {
      this.updateMode();
      this.refresh();
    },
    currentCountries() {
      this.updateMode();
    }
  }
};
</script>

<style lang="stylus">
@import '../assets/styles/vars'

.tip
  position: absolute
  left: 0
  top: 0
  font-size: 10px
  padding: 3px
  background-color: rgba(255, 255, 255, 0.8)

.vertical
  display: inline-block
  transform: rotate(-90deg) translate(-100%, 10px)
  transform-origin: top left

.chart
  margin-top: 10px
  position: relative

  .mode-select
    position: absolute
    top: 0
    left: 30px

  .header
    width: 20px
    position: absolute

    span
      display: inline-block
      text-align: center
      font-size: 10px

.chart-svg
  margin: 0 10px 0 27px

.chart text
  font-size: 8px

.chart .tickMonth
  stroke: #e0e0e0
  stroke-width: 1

.chart .tick
  stroke: $c-week-start
  stroke-width: 1

.grid
  stroke: #e0e0e0
  stroke-width: 0.5
  fill: none
  stroke-linecap: round

.line
  stroke-width: 2
  fill: none
  stroke-linecap: round
  stroke-linejoin: round
  pointer-events: none

rect.base
  stroke transparen
  stroke-width 1

rect.base:hover
  fill: $c-hover

rect.base.hi-1
  fill: $c-hover

rect.base.hi-2
  fill: $c-selected-light

rect.bar
  pointer-events: none

rect.bar[data-negative='true']
  fill: $c-negative

rect.confirmed
  fill: $c-confirmed

rect.dConfirmed
  fill: darken($c-confirmed, 30%)

rect.deceased
  fill: $c-deceased

rect.dDeceased
  fill: darken($c-deceased, 30%)

rect.recovered
  fill: $c-recovered

rect.dRecovered
  fill: darken($c-recovered, 30%)

rect.active
  fill: $c-active

rect.dActive
  fill: darken($c-active, 20%)
</style>
