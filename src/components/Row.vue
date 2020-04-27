<template>
  <div class="row" :class="selectedCls" @click="toggleCountry">
    <label class="tickbox">
      <input
        v-model="row.selected"
        type="checkbox"
        value="row.country"
        @click="toggleCountry"
      />
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
      :d-value="row.dConfirmed"
      :d2value="row.means.d2Confirmed"
      :max-value="rowStats['confirmed'].max"
      :max-d-value="rowStats['dConfirmed'].max"
      :min-value="rowStats['confirmed'].min"
      :min-d-value="rowStats['dConfirmed'].min"
      :bar-width="barWidths[1]"
      :label-width="labelWidth"
      :mode="mode"
    />
    <cell
      class="deceased"
      :log="false"
      :row="row"
      :value="row.deceased"
      :d-value="row.dDeceased"
      :d2value="row.means.d2Deceased"
      :max-value="rowStats['deceased'].max"
      :max-d-value="rowStats['dDeceased'].max"
      :min-value="rowStats['deceased'].min"
      :min-d-value="rowStats['dDeceased'].min"
      :bar-width="barWidths[2]"
      :label-width="labelWidth"
      :mode="mode"
    />
    <cell
      class="recovered"
      :log="false"
      :row="row"
      :value="row.recovered"
      :d-value="row.dRecovered"
      :d2value="row.means.d2Recovered"
      :max-value="rowStats['recovered'].max"
      :max-d-value="rowStats['dRecovered'].max"
      :min-value="rowStats['recovered'].min"
      :min-d-value="rowStats['dRecovered'].min"
      :bar-width="barWidths[3]"
      :label-width="labelWidth"
      :mode="mode"
    />
    <cell
      class="active"
      :log="false"
      :row="row"
      :value="row.active"
      :d-value="row.dActive"
      :d2value="row.means.d2Active"
      :max-value="rowStats['active'].max"
      :max-d-value="rowStats['dActive'].max"
      :min-value="rowStats['active'].min"
      :min-d-value="rowStats['dActive'].min"
      :bar-width="barWidths[4]"
      :label-width="labelWidth"
      :mode="mode"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import Cell from './Cell.vue';
import { mixin as columnMixin } from '../mixins/columns';

export default {
  name: 'Row',
  components: {
    Cell,
  },
  mixins: [columnMixin],
  props: {
    selected: Boolean,
    log: Boolean,
    row: { type: Object, required: true },
    mode: { type: Number, required: true },
  },
  data() {
    return {
      barWidth: 80,
      dWidth: 40,
      checked: false,
    };
  },
  computed: {
    selectedCls() {
      const { selected } = this.row;
      return {
        selected,
      };
    },
    ...mapGetters(['rowStats']),
  },
  watch: {
    checked() {
      this.$emit('select', this.row.country, this.checked);
    },
  },
  methods: {
    toggleCountry() {
      this.$emit('toggleCountry', this.row.country);
    },
  },
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
