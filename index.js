'use strict';
const csvParse = require('csv-parse');
const fs = require('fs');
const path = require('path');
const Table = require('cli-table');
const commandLineArgs = require('command-line-args');
const moment = require('moment');

const optionDefinitions = [
  { name: 'type', alias: 't', type: String },
  { name: 'month', alias: 'm', type: String },
  { name: 'year', alias: 'y', type: String },
  { name: 'desc', alias: 'd', type: String }
];
const options = commandLineArgs(optionDefinitions);

fs.readFile(path.join(__dirname, '/data/data.csv'), 'utf8', (err, data) => {
  if (err) throw err;

  let cleanData = [];
  let rows = data.split('\n');
  rows.map(function (row) {
    cleanData.push(_cleanStupidData(row));
  });
  // re assemble the clean data into a csv string
  let csvString = '';
  cleanData.map(function (row) {
    csvString += row + '\n';
  });
  // prepare the parser

  const parseSettings = {
    // auto_parse: true,
    // auto_parse_date: true,
    relax_column_count: true,
    relax: true
  };

  csvParse(csvString, parseSettings, function (err, output) {
    if (err) {
      console.error(err);
    } else {
      // slice off the first row
      output = output.slice(1, output.length);

      // filter before totalling

      // filter empty rows
      output = _filterEmpty(output);

      // type filter
      if (options.type) {
        output = _filterByType(options.type, output);
      }
      // date filter
      if (options.month || options.year) {
        output = _filterByMonthAndYear(options.month, options.year, output);
      }
      // description filter
      if (options.desc) {
        output = _filterByDescription(options.desc, output);
      }

      let totalIn = 0;
      let totalOut = 0;
      let table = new Table({
        head: ['Date', 'Description', 'Type', 'Money in', 'Money out', 'Balance']
      });

      output.map(function (row) {
        if (row !== '') {
          table.push(row);
          if (parseInt(row[3])) {
            totalIn = totalIn + parseInt(row[3]);
          }
          if (parseInt(row[4])) {
            totalOut = totalOut + parseInt(row[4]);
          }
        }
      });
      table.push(['', '', '', totalIn, totalOut, '']);
      console.log(table.toString());
    }
  });
});

function _cleanStupidData (row) {
  // count the number of commas, our data requires 5 so bad data has more
  let count = (row.match(/,/g) || []).length;
  if (count > 5) return _cleanDaftString(row);
  return row;
}

function _cleanDaftString (string) {
  let commaCount = 0;
  // get the length of the string
  // intereate over the string
  for (var i = 0; i < string.length; i++) {
    // check if the current char is a comma
    if (string.charAt(i) === ',') {
      // if it is increment the count
      commaCount++;
      // if the count is 2, the second comma, remove it
      if (commaCount === 2) {
        let before = string.slice(0, i);
        let after = string.slice(i + 1, string.length);
        let newString = before.concat(after);
        return newString;
      }
    }
  }
  return string;
}

function _filterEmpty (data) {
  let filteredArray = data.filter(function (value) {
    // when we get an empty row it contaions 1 string
    if (value.length > 1) {
      return value;
    }
  });
  return filteredArray;
}

function _filterByDescription (search, data) {
  let filteredArray = data.filter(function (value) {
    let regExpression = new RegExp(search, 'i');
    let result = value[1].search(regExpression);
    if (result >= 0) {
      return value;
    }
  });
  return filteredArray;
}

function _filterByMonthAndYear (month, year, data) {
  let targetDate = moment();
  targetDate.month(month);
  targetDate.year(year);
  let filteredArray = data.filter(function (value) {
    let date = moment(value[0]);
    if (date.isValid()) {
      // console.log(date.format('D M Y'));
      return date.isSame(targetDate, 'month');
    }
  });
  return filteredArray;
}

function _filterByType (type, data) {
  let filteredArray = data.filter(function (value) {
    let regExpression = new RegExp(type, 'i');
    let result = value[2].search(regExpression);
    if (result >= 0) {
      return value;
    }
  });
  return filteredArray;
}
