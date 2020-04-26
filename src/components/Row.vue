<template>
  <div class="row" :class="selectedCls" @click="toggleCountry">
    <label class="tickbox">
      <input type="checkbox" value="row.country" v-model="row.selected" @click="toggleCountry" />
      <span></span>
    </label>
    <div class="country" :style="columnWidthStyle(0)" :title="row.country">
      {{ row.country }}
    </div>
    <cell
      class="confirmed"
      :log="false"
      :row="row"
      :value="row.confirmed"
      :dValue="row.dConfirmed"
      :d2Value="row.__mean__.d2Confirmed"
      :maxValue="rowStats['confirmed'].max"
      :maxDValue="rowStats['dConfirmed'].max"
      :minValue="rowStats['confirmed'].min"
      :minDValue="rowStats['dConfirmed'].min"
      :barWidth="barWidths[1]"
      :labelWidth="labelWidth"
      :mode="mode"
    />
    <cell
      class="deceased"
      :log="false"
      :row="row"
      :value="row.deceased"
      :dValue="row.dDeceased"
      :d2Value="row.__mean__.d2Deceased"
      :maxValue="rowStats['deceased'].max"
      :maxDValue="rowStats['dDeceased'].max"
      :minValue="rowStats['deceased'].min"
      :minDValue="rowStats['dDeceased'].min"
      :barWidth="barWidths[2]"
      :labelWidth="labelWidth"
      :mode="mode"
    />
    <cell
      class="recovered"
      :log="false"
      :row="row"
      :value="row.recovered"
      :dValue="row.dRecovered"
      :d2Value="row.__mean__.d2Recovered"
      :maxValue="rowStats['recovered'].max"
      :maxDValue="rowStats['dRecovered'].max"
      :minValue="rowStats['recovered'].min"
      :minDValue="rowStats['dRecovered'].min"
      :barWidth="barWidths[3]"
      :labelWidth="labelWidth"
      :mode="mode"
    />
    <cell
      class="active"
      :log="false"
      :row="row"
      :value="row.active"
      :dValue="row.dActive"
      :d2Value="row.__mean__.d2Active"
      :maxValue="rowStats['active'].max"
      :maxDValue="rowStats['dActive'].max"
      :minValue="rowStats['active'].min"
      :minDValue="rowStats['dActive'].min"
      :barWidth="barWidths[4]"
      :labelWidth="labelWidth"
      :mode="mode"
    />
  </div>
</template>

<script>
import { mapGetters } from "vuex";

import Cell from "./Cell.vue";
import { mixin as columnMixin } from "../mixins/columns";

export default {
  name: "Row",
  props: {
    selected: Boolean,
    log: Boolean,
    row: Object,
    mean: Object,
    mode: Number
  },
  mixins: [columnMixin],
  components: {
    Cell
  },
  computed: {
    selectedCls () {
      let { selected } = this.row;
      return {
        selected
      }
    },
    ...mapGetters(["rowStats"])
  },
  data() {
    return {
      barWidth: 80,
      dWidth: 40,
      checked: false
    };
  },
  watch: {
    checked() {
      this.$emit("select", this.row.country, this.checked);
    }
  },
  mounted() {},
  methods: {
    toggleCountry() {
      this.$emit("toggleCountry", this.row.country);
    }
  }
};
</script>

<style lang="stylus">
@import "../assets/styles/vars"

.row
  display: flex
  flex-direction: row
  height: 15px
  line-height: 16px
  margin-bottom: 1px
  cursor pointer

.row:hover
  background-color: #f0f0f0

.row.selected
  background-color: $c-selected-light

.row > div
  flex: 0 1 auto
  font-size: 9px


.row > .country
  padding: 0 4px 0 4px
  width: $w-country
  text-align: left
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  line-height: 16px

.confirmed .bars
  .bar.value
    background-color: $c-confirmed
  .bar.d-value
    background-color: darken($c-confirmed, 30%)

.deceased .bars
  .bar.value
    background-color: $c-deceased
  .bar.d-value
    background-color: darken($c-deceased, 30%)

.recovered .bars
  .bar.value
    background-color: $c-recovered
  .bar.d-value
    background-color: darken($c-recovered, 30%)

.active .bars
  .bar.value
    background-color: $c-active
  .bar.d-value
    background-color: darken($c-active, 20%)
  .bar.d-value.negative
    background-color: $c-negative

$size = 9px

.tickbox
  padding: 0 0 0 3px
  box-sizing: border-box
  vertical-align: middle
  width: $w-tickbox

  input[type=checkbox]
    display: none
    box-sizing: border-box

    & + span
      box-sizing: border-box
      height: $size
      width: $size
      border: 1px solid grey
      display: inline-block
      position: relative
      background-color: transparent

    &:checked + span
      background-color: #c0c0c0
</style>
