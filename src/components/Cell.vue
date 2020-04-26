<template>
  <div class="cell" :style="{ width: `${allWidth}px` }">
    <div v-if="showValue" class="value-label" :style="{ width: `${labelWidth}px` }">
      {{ nFormat(value) }}
    </div>
    <span v-if="false">↗↘→</span>
    <div class="bars">
      <div class="value bar" v-if="showValue" :style="{ width: valueWidthPx }" />
      <div
        class="d-value bar"
        :class="dValueBarCls"
        v-if="showDValue"
        :style="{ width: dValueWidthPx }"
      />
      <div class="d-value-label" v-if="showDValue">
        {{ dFormat(dValue) }}
        <span class="symbol">
          <span v-if="d2Value < 0">↓</span>
          <span v-if="d2Value === 0">→</span>
          <span v-if="d2Value > 0">↑</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { max } from 'lodash';
import {
  nFormat,
  dFormat,
} from '../libs/common';

export default {
  name: 'Cell',
  props: {
    log: Boolean,
    row: Object,
    value: Number,
    dValue: Number,
    d2Value: Number,
    minValue: Number,
    maxValue: Number,
    minDValue: Number,
    maxDValue: Number,
    barWidth: Number,
    labelWidth: Number,
    mode: Number, // 0 = both, 1 = value only, 2 = dValue only
  },
  created() {},
  computed: {
    dValueBarCls() {
      if (this.dValue < 0) {
        return 'negative';
      }
      return '';
    },
    allWidth() {
      return this.barWidth + 2 * this.labelWidth + 2;
    },
    showValue() {
      return this.value > 0 && this.mode < 2;
    },
    showDValue() {
      return this.dValue !== 0 && this.mode !== 1;
    },
    currentMax() {
      if (this.mode === 2) {
        return max([this.maxDValue, Math.abs(this.minDValue), 1]);
      }
      return max([this.maxValue, Math.abs(this.minValue), 1]);
    },
    valueWidth() {
      let w = this.calcWidth(this.value);
      if (this.mode === 0) {
        if (this.dValue > 0) {
          w -= this.dValueWidth;
        }
      }
      if (w <= 0) {
        w = 1;
      }
      return w;
    },
    dValueWidth() {
      let w = this.calcWidth(Math.abs(this.dValue));
      if (w <= 0) {
        w = 1;
      }
      return w;
    },
    valueWidthPx() {
      return `${this.valueWidth}px`;
    },
    dValueWidthPx() {
      return `${this.dValueWidth}px`;
    },
  },
  mounted() {},
  methods: {
    nFormat,
    dFormat,
    calcWidth(number) {
      return Math.ceil((number * this.barWidth) / this.currentMax); // minimum 1px
    },
  },
};
</script>

<style lang="stylus">

$size = 16px
$line-height = 16px

.cell
  display flex
  flex-direction row
  height $size
  line-height $size
  font-family 'Fira Code', sans-serif
  font-weight 300
  font-family 'Nanum Gothic Coding', sans-serif
  font-family 'Roboto Condensed', sans-serif
  font-weight 300

.value-label
  padding-right 4px
  text-align right
  line-height $line-height

.bars
  text-align left
  position relative
  display flex
  flex-direction row

.cell > *
  flex 0 0 auto

.bars .value
  box-sizing border-box
  display inline-block
  height $size
  position relative
  margin-right 1px

.bars .d-value
  box-sizing border-box
  height $size

.d-value-label
  padding-left 4px
  line-height $line-height
</style>
