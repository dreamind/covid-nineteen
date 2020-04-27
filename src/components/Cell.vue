<template>
  <div class="cell" :style="{ width: `${allWidth}px` }">
    <div
      v-if="showValue"
      class="value-label"
      :style="{ width: `${labelWidth}px` }"
    >
      {{ nFormat(value) }}
    </div>
    <span v-if="false">↗↘→</span>
    <div class="bars">
      <div
        v-if="showValue"
        class="value bar"
        :style="{ width: valueWidthPx }"
      />
      <div
        v-if="showDValue"
        class="d-value bar"
        :class="dValueBarCls"
        :style="{ width: dValueWidthPx }"
      />
      <div v-if="showDValue" class="d-value-label">
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
import { nFormat, dFormat } from '../libs/common';

export default {
  name: 'Cell',
  props: {
    log: Boolean,
    row: { type: Object, required: true },
    value: { type: Number, required: true },
    dValue: { type: Number, required: true },
    d2Value: { type: Number, required: true },
    minValue: { type: Number, required: true },
    maxValue: { type: Number, required: true },
    minDValue: { type: Number, required: true },
    maxDValue: { type: Number, required: true },
    barWidth: { type: Number, required: true },
    labelWidth: { type: Number, required: true },
    mode: { type: Number, required: true }, // 0 = both, 1 = value only, 2 = dValue only
  },
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
  created() {},
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
@import "../assets/styles/vars"

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
