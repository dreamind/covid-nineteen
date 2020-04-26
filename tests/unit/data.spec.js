// import { shallowMount } from '@vue/test-utils';
const fs = require('fs');
const arrow = require('apache-arrow');
const moment = require('moment');
const { sortBy } = require('lodash');
const { countries, dates } = require('../../public/data/summary.json');

const data = fs.readFileSync('public/data/covid-19.arrow');
const table = arrow.Table.from([data]);
const countryNum = countries.length;
const dateNum = dates.length;

describe('Reading imported data', () => {
  it('passes basic validation', () => {
    expect(table.count()).toEqual(countryNum * dateNum);
    expect(table.filter(arrow.predicate.col('country').eq('Australia')).count()).toEqual(dateNum);

    let result = [];
    let date;
    let confirmed;
    table.filter(arrow.predicate.col('country').eq('Australia')).scan(
      (idx) => {
        result.push({ date: date(idx), confirmed: confirmed(idx) });
      },
      (batch) => {
        date = arrow.predicate.col('date').bind(batch);
        confirmed = arrow.predicate.col('confirmed').bind(batch);
      },
    );

    expect(result.length).toEqual(dateNum);
    const lastDate = result[result.length - 1].date;

    expect(moment(lastDate).valueOf()).toEqual(moment(dates[dateNum - 1]).valueOf() / 1000);
    expect(table.filter(arrow.predicate.col('date').eq(lastDate)).count()).toEqual(countryNum);

    expect(
      table
        .filter(
          arrow.predicate
            .col('country')
            .eq('Australia')
            .and(arrow.predicate.col('date').eq(lastDate)),
        )
        .count(),
    ).toEqual(1);

    result = [];
    table.filter(arrow.predicate.col('country').eq('Australia')).scan(
      (idx) => {
        result.push({ date: date(idx), confirmed: confirmed(idx) });
      },
      (batch) => {
        date = arrow.predicate.col('date').bind(batch);
        confirmed = arrow.predicate.col('confirmed').bind(batch);
      },
    );
    const sorted = sortBy(result, (x) => -x.confirmed);
    expect(sorted[0].confirmed).toBeGreaterThanOrEqual(sorted[sorted.length - 1].confirmed);

    function columnStats(columnName) {
      const column = table.getColumn(columnName);
      const count = column.length;
      let max = column.get(0);
      let min = max;
      let i = 1;
      while (i < count) {
        const value = column.get(i);
        if (value > max) {
          max = value;
        } else if (value < min) {
          min = value;
        }
        i += 1;
      }
      return {
        min,
        max,
        range: max - min,
        count,
      };
    }

    const stats = columnStats('date');
    expect(stats.max).toBeGreaterThanOrEqual(stats.min);
  });
});
