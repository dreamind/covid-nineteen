/**
 * Get data from remote or local clone and convert it to arrow file.
 *
 * Run:
 *
 * node scripts/get-data.js
 *
 * References:
 * - https://github.com/pomber/covid19
 *
 */
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const moment = require("moment");
const { reduce } = require("lodash");
const parse = require("csv-parse/lib/sync");
const arrow = require("apache-arrow");

const { Int32Vector, Dictionary, Vector, Uint32Vector, Table } = arrow;

const CONFIRMED = "time_series_covid19_confirmed_global.csv";
const DEATHS = "time_series_covid19_deaths_global.csv";
const RECOVERED = "time_series_covid19_recovered_global.csv";
const PATH_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/";

(function() {
  async function getRaw(source) {
    if (!source.startsWith("http")) {
      return fs.readFileSync(source);
    }
    const response = await fetch(source);
    return await response.text();
  }

  async function extractTallies(source) {
    const csv = await getRaw(source);
    const [header, ...rows] = parse(csv);
    // province, country, lat, long, dates
    const [, , , , ...dates] = header;
    const tally = {};

    const normalizedDates = dates.map(date => {
      const [month, day] = date.split("/").map(x => `0${x}`.slice(-2));
      return `2020-${month}-${day}`;
    });

    rows.forEach(([, country, , , ...counts]) => {
      tally[country] = tally[country] || {};
      normalizedDates.forEach((date, i) => {
        tally[country][date] = tally[country][date] || 0;
        tally[country][date] += +counts[i];
      });
    });
    return [tally, normalizedDates];
  }

  function toJSON(outputPath, countries, dates, confirmedTally, deathTally, recoveredTally) {
    const results = {};

    countries.forEach(country => {
      results[country] = dates.map(date => {
        const confirmed = confirmedTally[country][date];
        const deaths = deathTally[country][date];
        const recovered = recoveredTally[country][date];
        const active = confirmed - deaths - recovered;

        return {
          date,
          confirmed,
          active,
          recovered,
          deaths
        };
      });
    });

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  }

  async function toArrow(outputPath, countries, dates, confirmedTally, deathTally, recoveredTally) {
    const length = countries.length * dates.length;
    const countryArray = [];
    const dateIndexArray = new Uint32Array(length);
    const dateArray = new Uint32Array(length); // not sufficient for 2038
    const confirmedArray = new Uint32Array(length);
    const activeArray = new Uint32Array(length);
    const deceasedArray = new Uint32Array(length);
    const recoveredArray = new Uint32Array(length);
    const dConfirmedArray = new Int32Array(length);
    const dActiveArray = new Int32Array(length);
    const dDeceasedArray = new Int32Array(length);
    const dRecoveredArray = new Int32Array(length);
    const d2ConfirmedArray = new Int32Array(length);
    const d2ActiveArray = new Int32Array(length);
    const d2DeceasedArray = new Int32Array(length);
    const d2RecoveredArray = new Int32Array(length);

    let i = 0;
    countries.forEach(country => {
      dates.forEach((date, j) => {
        const confirmed = confirmedTally[country][date];
        const deceased = deathTally[country][date];
        const recovered = recoveredTally[country][date];
        const active = confirmed - deceased - recovered;
        let dConfirmed = 0;
        let dDeceased = 0;
        let dRecovered = 0;
        let dActive = 0;
        let d2Confirmed = 0;
        let d2Deceased = 0;
        let d2Recovered = 0;
        let d2Active = 0;
        dateIndexArray[i] = j;
        countryArray[i] = country;
        dateArray[i] = moment(date).unix(); // don't use valueOf
        confirmedArray[i] = confirmed;
        activeArray[i] = active;
        recoveredArray[i] = recovered;
        deceasedArray[i] = deceased;
        if (j > 0) {
          dConfirmed = confirmed - confirmedArray[i - 1];
          dDeceased = deceased - deceasedArray[i - 1];
          dRecovered = recovered - recoveredArray[i - 1];
          dActive = active - activeArray[i - 1];
        }
        if (j > 1) {
          d2Confirmed = dConfirmed - dConfirmedArray[i - 1];
          d2Deceased = dDeceased - dDeceasedArray[i - 1];
          d2Recovered = dRecovered - dRecoveredArray[i - 1];
          d2Active = dActive - dActiveArray[i - 1];
        }
        dConfirmedArray[i] = dConfirmed;
        dDeceasedArray[i] = dDeceased;
        dRecoveredArray[i] = dRecovered;
        dActiveArray[i] = dActive;
        d2ConfirmedArray[i] = d2Confirmed;
        d2DeceasedArray[i] = d2Deceased;
        d2RecoveredArray[i] = d2Recovered;
        d2ActiveArray[i] = d2Active;
        i++;
      });
    });

    const covid = Table.new(
      [
        Vector.from({
          values: countryArray,
          type: new Dictionary(new arrow.Utf8(), new arrow.Int32())
        }),
        // Utf8Vector.from(countryArray),
        Uint32Vector.from(dateIndexArray),
        Uint32Vector.from(dateArray),
        Uint32Vector.from(confirmedArray),
        Uint32Vector.from(activeArray),
        Uint32Vector.from(recoveredArray),
        Uint32Vector.from(deceasedArray),
        Int32Vector.from(dConfirmedArray),
        Int32Vector.from(dRecoveredArray),
        Int32Vector.from(dActiveArray),
        Int32Vector.from(dDeceasedArray),
        Int32Vector.from(d2ConfirmedArray),
        Int32Vector.from(d2RecoveredArray),
        Int32Vector.from(d2ActiveArray),
        Int32Vector.from(d2DeceasedArray)
      ],
      [
        "country",
        "dateIndex",
        "date",
        "confirmed",
        "active",
        "recovered",
        "deceased",
        "dConfirmed",
        "dRecovered",
        "dActive",
        "dDeceased",
        "d2Confirmed",
        "d2Recovered",
        "d2Active",
        "d2Deceased"
      ]
    );

    const uint8Array = await covid.serialize();
    fs.writeFileSync(outputPath, Buffer.from(uint8Array));
  }

  async function main(sourcePath, outputPath) {
    const [confirmedTally, dates] = await extractTallies(path.resolve(sourcePath, CONFIRMED));
    const [deathTally] = await extractTallies(path.resolve(sourcePath, DEATHS));
    const [recoveredTally] = await extractTallies(path.resolve(sourcePath, RECOVERED));
    const countries = Object.keys(confirmedTally).sort();

    console.log("Processing ...");
    console.log("Countries count:", countries.length);
    console.log("Dates count:", dates.length);
    console.log("Dates range:", dates[0], dates[dates.length - 1]);
    console.log(
      "Dates range:",
      moment(dates[0]).valueOf(),
      moment(dates[dates.length - 1]).valueOf()
    );

    fs.writeFileSync(
      "public/data/summary.json",
      JSON.stringify(
        {
          countries,
          dates
        },
        null,
        2
      )
    );
    await toArrow(outputPath, countries, dates, confirmedTally, deathTally, recoveredTally);
  }

  if (require.main === module) {
    main("../COVID-19/csse_covid_19_data/csse_covid_19_time_series", "public/data/covid-19.arrow");
    // This module was run directly from the command line (node scripts/get-data.js)
  } else {
    // Otherwise, this module was loaded by require.
    module.exports = main;
  }
})();
