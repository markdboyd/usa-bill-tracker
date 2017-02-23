var https = require('https');
var pug = require('pug');
var querystring = require('querystring');
var Promise = require('bluebird');
var config = require('../config');
var he = require('he');

module.exports.homepage = homepage;

function homepage(req, res, next) {
  getBillsData(req.query).then(function(billsData) {
    var query = req.query.query;
    if (query) {
      query = he.encode(query);
    }
    var billTrackerData = JSON.stringify({
      currentSearch: {
        query: query,
        congress: req.query.congress,
        billType: req.query.billType
      }
    });
    res.render('index', {
      title: 'USA Bill Tracker',
      options: config.options,
      billTypes: config.values.billTypes,
      billStatuses: config.values.billStatuses,
      resultsPerPage: config.search.resultsPerPage,
      queryParams: req.query,
      billTrackerData: billTrackerData,
      billsData: billsData,
      buildQueryString: buildQueryString,
      queryValueExists: queryValueExists
    });
  })
}

function queryValueExists(queryParams, key, value, multipleVals) {
  if (!queryParams) return false;
  if ((multipleVals && queryParams[key] && queryParams[key].indexOf(value) != -1) ||
      (!multipleVals && queryParams[key])) {
    return true;
  }
  return false;
}

function buildQueryString(queryParams, key, value, multipleVals) {
  // Use JSON library to create a clone of the
  // queryParams object.
  var newParams = JSON.parse(JSON.stringify(queryParams));
  if (multipleVals) {
    // If a value doesn't exist for this param,
    // add it as an array.
    if (!newParams[key]) {
      newParams[key] = [value];
    }
    // Otherwise if a value already exists for this
    // param and the value is an array, add the
    // current value to that array.
    else if (newParams[key].constructor === Array &&
             newParams[key].indexOf(value) == -1) {
      newParams[key].push(value);
    }
  }
  else {
    newParams[key] = value;
  }

  // Bill status links should not have query
  // parameters for page so that they always
  // reset to the first page.
  if (key == 'billStatus') {
    delete newParams.page;
  }

  var params = [];
  for (var key in newParams) {
    var paramString = key;
    var queryValue = newParams[key];

    // Certain query params should always have a
    // suffix of "[]" so that they are always
    // interpreted by Express as an array of
    // values.
    if (key == 'congress' || key == 'billType') {
      paramString += '[]';
    }

    paramString += '=';

    if (queryValue.constructor && queryValue.constructor === Array) {
      for (i = 0; i < queryValue.length; i++) {
        var value = queryValue[i];
        params.push(paramString + value);
      }
    }
    else {
      params.push(paramString + queryValue);
    }
  }

  return '?' + params.join('&');
}

function getBillsData(params) {
  return new Promise(function(resolve, reject) {
    if (!params.query &&
        !params.congress &&
        !params.billType) {
      return resolve();
    }

    var billRequests = [];
    billRequests.push({ key: 'bills', url: getBillSearchUrl(params) });
    var billStatusRequests = getBillStatusRequests(params);
    billRequests = billRequests.concat(billStatusRequests);

    var results = {};
    Promise.map(billRequests, fetchBillData)
      .each(function(result) { Object.assign(results, result); })
      .then(function() { return resolve(results); })
      .catch(function(err) { reject(err); })
  });
}

function fetchBillData(request) {
  return new Promise(function(resolve, reject) {
    https.get(request.url, function(res) {
      var response = '';

      res.on('data', function(chunk) {
        response += chunk;
      });

      res.on('end', function() {
        var billsData = JSON.parse(response);
        var result = {};
        result[request.key] = billsData;
        resolve(result);
      });
    }).on('error', function(err) {
      reject(err);
    });
  });
}

function getBillStatusRequests(params) {
  var billStatusUrls = [];
  for (var billStatus in config.values.billStatuses) {
    var billStatusParams = {
      fields: '[]',
      billStatus: billStatus,
      query: params.query,
      congress: params.congress,
      billType: params.billType
    };
    billStatusUrls.push({ key: billStatus, url: getBillSearchUrl(billStatusParams) });
  }
  return billStatusUrls;
}

function getBillSearchUrl(params) {
  var API_HOST = 'https://congress.api.sunlightfoundation.com';
  var API_KEY = '06bc950b743c456ba5a5a3278a0617a1';

  var requestUrl = API_HOST + '/bills/search';
  var searchParams = {
    apikey: API_KEY,
    per_page: config.search.resultsPerPage
  };

  var fields = config.search.fields;
  var billStatusConditions = config.search.billStatusConditions;
  var billStatus = params.billStatus || 'introduced';

  if (params.query) {
    searchParams['query'] = '"' + params.query + '"';
  }

  if (params.congress) {
    searchParams['congress__in'] = params.congress.join('|');
  }

  if (params.billType) {
    searchParams['bill_type__in'] = params.billType.join('|');
  }

  searchParams = Object.assign(searchParams, billStatusConditions[billStatus]);

  if (params.page) {
    searchParams['page'] = params.page;
  }

  if (params.fields) {
    searchParams['fields'] = params.fields;
  }
  else {
    searchParams['fields'] = fields.join(',');
  }

  searchParams = querystring.stringify(searchParams);
  requestUrl += '?' + searchParams;

  console.log(requestUrl);
  return requestUrl;
}
