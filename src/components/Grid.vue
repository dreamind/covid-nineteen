<template>
  <div class="grid">
    <div class="grid-header">
      <label class="tickbox">
        <input
          v-model="countryReset"
          title="Clear country selection"
          type="checkbox"
          value="false"
          @click.prevent="resetCountries"
        />
        <span></span>
      </label>
      <div
        v-for="c in [0, 1, 2, 3, 4]"
        :key="c"
        class="heading"
        :style="columnWidthStyle(c)"
      >
        <span>{{ modeHeading(c) }}</span>
        <div class="sorter" :class="sorterCls(c)">
          <span @click="setSorter(c, 1)">▼</span>
          <span @click="setSorter(c, 2)">▲</span>
        </div>
      </div>
    </div>
    <div class="rows-wrapper scrolled">
      <row
        v-for="row in sortedRows"
        :key="row.country"
        :row="row"
        :mode="mode"
        @toggleCountry="toggleCountry"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { orderBy, each } from 'lodash';
import Row from './Row.vue';
import { mixin as columnMixin } from '../mixins/columns';
import { modeHeadingMap, sorterMap, columns } from '../libs/common';

export default {
  name: 'Grid',
  components: {
    Row,
  },
  mixins: [columnMixin],
  props: {
    mode: { type: Number, required: true },
  },
  data() {
    return {
      countryReset: false,
      sortedRows: [],
      currentSorter: 1,
      sorters: [0, 1, 0, 0, 0],
    };
  },
  computed: {
    ...mapGetters(['rows', 'rowStats', 'currentDate', 'currentCountries']),
  },
  watch: {
    mode() {
      this.updateSorted();
    },
    rows() {
      this.updateSorted();
      this.$emit('change', this.rowStats);
    },
  },
  methods: {
    updateSorted() {
      const c = this.currentSorter;
      const val = this.sorters[c];
      const order = val === 1 ? 'desc' : 'asc';
      const field = this.mode === 2 ? columns[c].dField : columns[c].field;
      this.sortedRows = orderBy(this.rows, field, order);
    },
    setSorter(c, val) {
      const { sorters } = this;
      this.currentSorter = c;
      each(sorters, (sorter, i) => {
        if (i === c) {
          sorters[i] = val;
        } else {
          sorters[i] = 0;
        }
      });
      this.updateSorted();
    },
    modeHeading(c) {
      if (!c) {
        return 'Country';
      }
      // let r = `${modeHeadingMap[this.mode]} ${columns[c].title}`;
      let r = `${modeHeadingMap[this.mode]}`;
      if (!this.mode) {
        r += ' (±New)';
      }
      return r;
    },
    headingWidthStyle(c) {
      let width = this.barWidths[c] + 2 * this.labelWidth + 2;
      width += 'px';
      return {
        width,
      };
    },
    sorterCls(c) {
      const sorter = this.sorters[c];
      return sorterMap[sorter];
    },
    resetCountries() {
      this.countryReset = false;
      this.$emit('resetCountries');
    },
    toggleCountry(country) {
      this.$emit('toggleCountry', country);
    },
  },
};
</script>

<style lang="stylus">
@import '../assets/styles/vars'

.grid-header
  display flex
  flex-direction row
  margin-bottom 7px

  .tickbox
    visibility visible
    padding-top 2px

  .heading
    font-family 'Roboto Condensed', sans-serif
    display flex
    flex-direction row
    justify-content center
    align-items flex-end

  .country
    width $w-country

.sorter
  margin-left 4px

  span
    font-family 'Fira Code', sans-serif
    font-weight 300
    color #e0e0e0
    cursor pointer

.sorter.desc
  & span:first-child
    color #707070

.sorter.asc
  & span:nth-child(2)
    color #707070

.grid
  padding-right 10px
  margin-right 10px
  position relative

.rows-wrapper
  padding-right 8px
  display flex
  flex-direction column
  overflow-x hidden
  overflow-y auto
  position absolute
  top 23px
  bottom 0
  left 0
  right 0
  // height calc(100% - 16px)
</style>
