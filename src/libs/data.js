/* eslint-disable no-param-reassign */
import axios from 'axios';
import { Table, predicate } from 'apache-arrow';
import moment from 'moment';
import {
  reduce, each, clone, meanBy,
} from 'lodash';
import { dates } from '../../public/data/summary.json';
import {
  dateMap, fields, measures, categories,
} from './common';

let table = null;

const measuresForExt = ['d2Confirmed', 'd2Deceased', 'd2Recovered', 'd2Active'];

async function pull() {
  if (table) {
    return table;
  }
  const { data } = await axios.get('data/covid-19.arrow', {
    responseType: 'arraybuffer',
  });
  table = await Table.from([data]);
  return table;
}

function scan(predicates) {
  const rows = [];
  const binder = {};
  const stats = {};
  const metrics = {
    max: Number.MIN_SAFE_INTEGER,
    min: Number.MAX_SAFE_INTEGER,
    sum: 0,
    count: 0,
  };

  each(measures, (measure) => {
    stats[measure] = clone(metrics);
  });

  table.filter(predicates).scan(
    (idx) => {
      const row = {};
      each(categories, (category) => {
        const v = binder[category](idx);
        row[category] = v;
      });
      each(measures, (measure) => {
        const v = binder[measure](idx);
        row[measure] = v;
        if (stats[measure].min > v) {
          stats[measure].min = v;
        } else if (stats[measure].max < v) {
          stats[measure].max = v;
        }
        stats[measure].sum += v;
        stats[measure].count += 1;
      });
      rows.push(row);
    },
    (batch) => {
      each(fields, (field) => {
        binder[field] = predicate.col(field).bind(batch);
      });
    },
  );
  return { rows, stats };
}

function snapshotAt(date) {
  return scan(predicate.col('date').eq(moment(date).unix()));
}

function timeseriesOf([country, ...countries]) {
  const predicates = reduce(
    countries,
    (preds, countri) => preds.or(predicate.col('country').eq(countri)),
    predicate.col('country').eq(country),
  );
  return scan(predicates);
}

function collectFields(binder, idx, fields2, row) {
  each(fields2, (field) => {
    row[field] = binder[field](idx);
  });
}

function collectStats(binder, idx, row, stats, collector) {
  each(measures, (measure) => {
    const v = binder[measure](idx);
    const stat = stats[measure];
    row[measure] = v;
    if (collector) {
      collector(v, measure);
    }
    if (stat.min > v) {
      stat.min = v;
    } else if (stat.max < v) {
      stat.max = v;
    }
    stat.sum += v;
    stat.count += 1;
  });
}

function extSnapshotAt(dateIndex, days) {
  if (typeof dateIndex === 'string') {
    dateIndex = dateMap[dateIndex];
  }
  const rows = [];
  const binder = {};
  const stats = {};
  const ext = {};
  const dateIndexStart = dateIndex - days - 1;

  const metrics = {
    max: Number.MIN_SAFE_INTEGER,
    min: Number.MAX_SAFE_INTEGER,
    sum: 0,
    count: 0,
  };

  const dateFilter = predicate
    .col('dateIndex')
    .ge(dateIndexStart)
    .and(predicate.col('dateIndex').le(dateIndex));

  each(measures, (measure) => {
    stats[measure] = clone(metrics);
  });

  table.filter(dateFilter).scan(
    (idx) => {
      const row = {
        means: {},
        selected: false,
      };
      const dateIdx = binder.dateIndex(idx);
      const country = binder.country(idx);
      // Store historical data for the past days
      if (!ext[country]) {
        ext[country] = {
          history: [],
          row: null,
        };
      }
      if (dateIdx === dateIndex) {
        collectFields(binder, idx, categories, row);
        collectStats(binder, idx, row, stats);
        ext[country].history.push(row);
        ext[country].row = row;
        rows.push(row);
      } else {
        collectFields(binder, idx, measures, row);
        ext[country].history.push(row);
      }
    },
    (batch) => {
      each(fields, (field) => {
        binder[field] = predicate.col(field).bind(batch);
      });
    },
  );

  each(ext, ({ history, row }, country) => {
    ext[country].means = {};
    each(measuresForExt, (measure) => {
      const mean = meanBy(history, measure);
      ext[country].means[measure] = mean;
      row.means[measure] = mean;
    });
  });

  return { rows, stats, ext };
}

function extTimeSeriesOf([country, ...countries] = []) {
  const metrics = {
    max: Number.MIN_SAFE_INTEGER,
    min: Number.MAX_SAFE_INTEGER,
    sum: 0,
    count: 0,
    // of all selected countries
    maxSum: Number.MIN_SAFE_INTEGER,
    minSum: Number.MAX_SAFE_INTEGER,
  };

  const stats = {};
  const series = [];
  const binder = {};

  each(measures, (measure) => {
    stats[measure] = clone(metrics);
  });

  each(dates, (date) => {
    const dateIndex = dateMap[date];
    series[dateIndex] = {
      // rows: [],
      sum: {},
      countries: {},
    };
    each(measures, (measure) => {
      series[dateIndex].sum[measure] = 0;
    });
  });

  let filter;
  let predicates;
  if (country) {
    predicates = reduce(
      countries,
      (preds, countri) => preds.or(predicate.col('country').eq(countri)),
      predicate.col('country').eq(country),
    );
    filter = table.filter(predicates);
  } else {
    filter = table;
  }

  filter.scan(
    (idx) => {
      const row = {};
      const dateIndex = binder.dateIndex(idx);
      const countri = binder.country(idx);

      collectFields(binder, idx, categories, row);
      each(measures, (measure) => {
        const v = binder[measure](idx);
        const stat = stats[measure];
        row[measure] = v;
        if (stat.min > v) {
          stat.min = v;
        } else if (stat.max < v) {
          stat.max = v;
        }
        stat.sum += v;
        stat.count += 1;
        const sum = series[dateIndex].sum[measure] + v;
        if (stat.maxSum < sum) {
          stat.maxSum = sum;
        }
        if (stat.minSum > sum) {
          stat.minSum = sum;
        }
        series[dateIndex].sum[measure] = sum;
      });
      series[dateIndex].countries[countri] = row;
      // series[dateIndex].rows.push(row);
    },
    (batch) => {
      each(fields, (field) => {
        binder[field] = predicate.col(field).bind(batch);
      });
    },
  );

  // TO DO: running average
  return { stats, series };
}

export {
  pull, snapshotAt, timeseriesOf, extSnapshotAt, extTimeSeriesOf,
};
