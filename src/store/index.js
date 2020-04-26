import Vue from 'vue';
import Vuex from 'vuex';
import {
  keyBy, each, union, without,
} from 'lodash';
import * as api from '../libs/data';
import { countries, dates, dateMap } from '../libs/common';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    movingDays: 3,
    table: null,
    countries,
    dates,
    dateMap,
    currentDate: null,
    currentDateIdx: 0,
    rows: [],
    rowMap: {},
    rowStats: null,
    currentCountries: [],
    series: [],
    seriesStats: null,
    totalStats: {},
  },
  getters: {
    table: (state) => state.table,
    countries: (state) => state.countries,
    dates: (state) => state.dates,
    dateMap: (state) => state.dateMap,
    currentDate: (state) => state.currentDate,
    currentDateIdx: (state) => state.currentDateIdx,
    rows: (state) => state.rows,
    rowMap: (state) => state.rowMap,
    rowStats: (state) => state.rowStats,
    currentCountries: (state) => state.currentCountries,
    series: (state) => state.series,
    seriesStats: (state) => state.seriesStats,
    totalStats: (state) => state.totalStats,
  },
  mutations: {
    setTable(state, table) {
      state.table = table;
    },
    setSnapshot(state, {
      currentDate, currentDateIdx, rows, rowStats,
    }) {
      state.currentDate = currentDate;
      state.currentDateIdx = currentDateIdx;
      state.rows = rows;
      const rowMap = keyBy(rows, 'country');
      each(state.currentCountries, (country) => {
        rowMap[country].selected = true;
      });
      state.rowMap = rowMap;
      state.rowStats = rowStats;
      const { series } = state;
      if (series && series.length) {
        state.totalStats = series[currentDateIdx].sum;
      }
    },
    updateCountries(state, { country, selected }) {
      if (!country) {
        each(state.rowMap, (row) => {
          if (row.selected) {
            Vue.set(row, 'selected', false);
          }
        });
      } else {
        Vue.set(state.rowMap[country], 'selected', selected);
      }
    },
    setTimeseries(state, { currentCountries, series, seriesStats }) {
      state.currentCountries = currentCountries;
      state.series = series;
      state.seriesStats = seriesStats;
      state.totalStats = series[dateMap[state.currentDate]].sum;
    },
  },
  actions: {
    async pull(context) {
      const table = await api.pull();
      context.commit('setTable', table);
    },
    getSnapshot(context, currentDateP, currentDateIdxP) {
      const { state } = context;
      let currentDate = currentDateP;
      let currentDateIdx = currentDateIdxP;
      if (!currentDateP) {
        currentDateIdx = dates.length - 1;
        currentDate = dates[currentDateIdx];
      }
      if (!currentDateIdx) {
        currentDateIdx = dateMap[currentDate];
      }
      const { rows, stats: rowStats } = api.extSnapshotAt(currentDate, state.movingDays);
      context.commit('setSnapshot', {
        currentDate, currentDateIdx, rows, rowStats,
      });
    },
    updateCountries(context, country) {
      const { currentCountries, rowMap } = context.state;
      let newCountries;
      let selected;

      if (!country) {
        newCountries = [];
      } else {
        selected = rowMap[country].selected;
        if (selected) {
          newCountries = without(currentCountries, country);
        } else {
          newCountries = union(currentCountries, [country]);
        }
        selected = !selected;
      }
      context.commit('updateCountries', { country, selected });
      context.dispatch('getTimeseries', newCountries);
    },
    getTimeseries(context, currentCountries = []) {
      const { series, stats: seriesStats } = api.extTimeSeriesOf(currentCountries);
      context.commit('setTimeseries', { currentCountries, series, seriesStats });
    },
  },
});
