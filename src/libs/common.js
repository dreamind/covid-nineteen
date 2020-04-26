import { reduce, each } from 'lodash';
import numeral from 'numeral';
import { countries, dates } from '../../public/data/summary.json';

const dateMap = reduce(
  dates,
  (o, e, i) => {
    // eslint-disable-next-line no-param-reassign
    o[e] = i;
    return o;
  },
  {},
);

const categories = ['country', 'date', 'dateIndex'];

const measures = [
  'confirmed',
  'dConfirmed',
  'd2Confirmed',
  'deceased',
  'dDeceased',
  'd2Deceased',
  'recovered',
  'dRecovered',
  'd2Recovered',
  'active',
  'dActive',
  'd2Active',
];

const fields = categories.concat(measures);

const modeHeadingMap = {
  0: 'Total',
  1: 'Total',
  2: 'New',
};

const sorterMap = {
  0: 'none',
  1: 'desc',
  2: 'asc',
};

const columns = [
  {
    field: 'country',
    title: 'Country',
    symbol: '',
  },
  {
    field: 'confirmed',
    title: 'Confirmed',
    dField: 'dConfirmed',
    symbol: '',
  },
  {
    field: 'deceased',
    title: 'Deceased',
    dField: 'dDeceased',
    symbol: '†',
  },
  {
    field: 'recovered',
    title: 'Recovered',
    dField: 'dRecovered',
    symbol: '♥',
  },
  {
    field: 'active',
    title: 'Active',
    dField: 'dActive',
    symbol: '⌂',
  },
];

const columnMap = {};

each(columns, ({
  field, title, dField, symbol,
}) => {
  columnMap[field] = {
    field,
    title: `Total ${title}`,
    symbol: `<span class="legend">∑${symbol}</span>`,
  };
  columnMap[dField] = {
    field: dField,
    title: `Daily ${title}`,
    symbol: `<span class="legend">Δ${symbol}</span>`,
  };
});

const numberFormatter = new Intl.NumberFormat().format;

const sFormat = (number) => numeral(number).format('0.0a');

const nFormat = (number) => numberFormatter(number);
const dFormat = (number) => {
  const n = numberFormatter(number);
  return number <= 0 ? n : `+${n}`;
};

const INTERVAL_NUM = 3;
const calcGridInterval = (max) => {
  // find smaller but closest 10, 100, 1000, ...
  let decimals = 10 ** Math.floor(Math.log10(max - 1));
  // dec /= 2 // for closest 5
  const interval = max / INTERVAL_NUM;

  if (interval < decimals) {
    decimals /= 10;
  }
  return Math.floor(interval / decimals) * decimals;
};

// Color brewer 12-class Paired
// The first four have been used for measures
const palette = [
  // "#a6cee3",
  // "#1f78b4",
  // "#b2df8a",
  // "#33a02c",
  '#fb9a99',
  '#e31a1c',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffff99',
  '#b15928',
];

export const SNAPSHOT_BOTH = 0;
export const SNAPSHOT_TOTAL = 1;
export const SNAPSHOT_CHANGE = 2;

export const TIMESERIES_COMBINED = 0;
export const TIMESERIES_COMPARED = 1;
export const TIMESERIES_BOTH = 2;

export {
  calcGridInterval,
  palette,
  categories,
  countries,
  dates,
  dateMap,
  fields,
  measures,
  modeHeadingMap,
  sorterMap,
  columns,
  columnMap,
  nFormat,
  dFormat,
  sFormat,
};
