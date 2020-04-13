// import { shallowMount } from '@vue/test-utils';
const fs = require("fs");
const arrow = require("apache-arrow");
const data = fs.readFileSync("public/data/covid-19.arrow");
const { countries, dates } = require("../../public/data/summary.json");
const table = arrow.Table.from([data]);
const moment = require("moment");
const { sortBy } = require("lodash");
const countryNum = countries.length;
const dateNum = dates.length;

describe("Reading imported data", () => {
  it("passes basic validation", () => {
    expect(table.count()).toEqual(countryNum * dateNum);
    expect(table.filter(arrow.predicate.col("country").eq("Australia")).count()).toEqual(dateNum);

    let result = [],
      date,
      confirmed;
    table.filter(arrow.predicate.col("country").eq("Australia")).scan(
      idx => {
        result.push({ date: date(idx), confirmed: confirmed(idx) });
      },
      batch => {
        date = arrow.predicate.col("date").bind(batch);
        confirmed = arrow.predicate.col("confirmed").bind(batch);
      }
    );

    expect(result.length).toEqual(dateNum);
    const lastDate = result[result.length - 1].date;

    expect(moment(lastDate).valueOf()).toEqual(moment(dates[dateNum - 1]).valueOf() / 1000);
    expect(table.filter(arrow.predicate.col("date").eq(lastDate)).count()).toEqual(countryNum);

    expect(
      table
        .filter(
          arrow.predicate
            .col("country")
            .eq("Australia")
            .and(arrow.predicate.col("date").eq(lastDate))
        )
        .count()
    ).toEqual(1);

    result = [];
    table.filter(arrow.predicate.col("country").eq("Australia")).scan(
      idx => {
        result.push({ date: date(idx), confirmed: confirmed(idx) });
      },
      batch => {
        date = arrow.predicate.col("date").bind(batch);
        confirmed = arrow.predicate.col("confirmed").bind(batch);
      }
    );
    let sorted = sortBy(result, x => -x.confirmed);
    expect(sorted[0].confirmed).toBeGreaterThanOrEqual(sorted[sorted.length - 1].confirmed);

    function columnStats(table, columnName) {
      const column = table.getColumn(columnName);
      const count = column.length;
      let max = column.get(0);
      let min = max;
      for (const value of column) {
        if (value > max) {
          max = value;
        } else if (value < min) {
          min = value;
        }
      }
      return {
        min,
        max,
        range: max - min,
        count
      };
    }

    let stats = columnStats(table, "date");
    expect(stats.max).toBeGreaterThanOrEqual(stats.min);
  });
});
