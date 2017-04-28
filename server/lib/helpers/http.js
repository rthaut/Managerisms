const http = require('http');
const q = require('q');

exports.getDeferred = getDeferred = function (options, encoding, expectedContentType) {

  encoding = encoding || 'utf8';

  let deferred = q.defer();

  http.get(options, (res) => {

    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let err;
    if (statusCode !== 200) {
      err = new Error(`Request Failed.\n` + `Status Code: ${statusCode}`);
    } else if ((expectedContentType !== undefined) && !contentType.toLowerCase().startsWith(expectedContentType.toLowerCase())) {
      err = new Error(`Invalid content-type.\n` + `Expected '${expectedContentType}' but received '${contentType}'`);
    }

    if (err) {
      console.error(err.message);
      res.resume();
      deferred.reject(err);
      return;
    }

    res.setEncoding(encoding);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      deferred.resolve(data);
    });

  }).on('error', (err) => {
    console.error(err.message);
    deferred.reject(err);
  });

  return deferred.promise;
};

exports.getDeferredJSON = getDeferredJSON = function (options, encoding) {

  return getDeferred(options, encoding, 'application/json').then((data) => {
    try {
      return JSON.parse(data);
    } catch (ex) {
      console.error(ex);
      return;
    }
  });

}
