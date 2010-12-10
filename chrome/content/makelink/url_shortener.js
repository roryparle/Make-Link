/**
 * Manages the use of URL shortening services like TinyURL.
 */
net.soylentred.makelink.UrlShortener = function() {
  this.logger_ = new net.soylentred.makelink.Logger(
      'net.soylentred.makelink.UrlShortener');
  this.logger_.logCall('<init>', arguments);
  this.cache_ = {};
};

/* TODO: Make request asynchronous and have some UI for when they are
 *     processing/complete.
 * TODO: Support more URL shortening services.
 */

/**
 * Gets a shortened URL, trying multiple services until one works.
 *
 * @param url The URL to get a shortened version of.
 * @return A shortened URL, or null if no service worked.
 */
net.soylentred.makelink.UrlShortener.prototype.getShortUrl = function(url) {
  this.logger_.logCall('getShortUrl', arguments);
  if (this.cache_[url]) {
    return this.cache_[url];
  }
  var shortenedUrl = this.getDurlShortenedUrl(url) ||
      this.getTinyUrlShortenedUrl(url);
  if (shortenedUrl) {
    this.cache_[url] = shortenedUrl;
  }
  return shortenedUrl;
};

net.soylentred.makelink.UrlShortener.prototype.getDurlShortenedUrl =
    function(url) {
  this.logger_.logCall('getDurlShortenedUrl', arguments);
  var request = new XMLHttpRequest();
  request.open('GET', "http://durl.us/api/?url=" + escape(url), false);
  request.send(null);
  if (request.status != 200) {
    this.logger_.warning('Failed to fetch durl.us shortened URL.' +
        ' Response code ' + request.status);
    return null;
  }
  try {
    var result = request.responseXML.getElementsByTagName('result')[0]
        .firstChild.nodeValue;
    if (result == '1') {
      var shortenedUrl = request.responseXML
          .getElementsByTagName('durl_url')[0].firstChild.nodeValue;
      return shortenedUrl;
    } else {
      this.logger_.warning('Failed to fetch durl.us shortened URL.');
    }
  } catch (e) {	
    this.logger_.warning('Failed to fetch durl.us shortened URL.' +
        ' Badly-formed response.\n' + request.responseText);
  }
  return null;
};

net.soylentred.makelink.UrlShortener.prototype.getTinyUrlShortenedUrl =
    function(url) {
  this.logger_.logCall('getTinyUrlShortenedUrl', arguments);
  request = new XMLHttpRequest();
  request.open('GET', 'http://tinyurl.com/create.php?url=' + escape(url),
      false);
  request.send(null);
  if (request.status != 200 || !request.responseText) {
    this.logger_.warning('Failed to fetch TinyURL shortened URL.' +
        ' Response code ' + request.status);
    return null;
  }
  try {
    var shortenedUrl = /<b>http:\/\/tinyurl.com\/[a-zA-Z0-9]+<\/b>/
        .exec(request.responseText)[0].replace(/<\/?b>/ig, "");
    return shortenedUrl;
  } catch (e) {
    this.logger_.warning('Couldn\'t parse the TinyURL.com response.\n' +
        request.responseText);
    return null;
  }
};
