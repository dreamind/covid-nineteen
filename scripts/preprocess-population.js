const fs = require('fs');
const { each, isNil, reduce } = require('lodash');
const parse = require('csv-parse/lib/sync');

const populationSrc = 'data-sources/population/population-country.csv';
const countryAliases = require('../data-sources/population/alias-country.json');
const others = require('../data-sources/population/population-others.json');

const [, ...rows] = parse(fs.readFileSync(populationSrc));
const mainPopulation = {}; const
  result = {};
let { countries } = require('../public/data/summary.json');

countries = reduce(countries, (r, e) => { r[e] = true; return r; }, {});

rows.forEach(([country, population]) => {
  mainPopulation[country] = +population.replace(/\s/g, '');
});

each(countries, (val, country) => {
  let population = mainPopulation[country];

  if (!isNil(population)) {
    result[country] = population;
    return;
  }
  const alias = countryAliases[country];
  if (alias) {
    result[country] = mainPopulation[alias];
    return;
  }
  population = others[country];
  if (!isNil(population)) {
    result[country] = population;
  } else {
    console.log('Failed to get population of ', country);
  }
});

fs.writeFileSync('public/data/population.json', JSON.stringify(result, null, 2));
