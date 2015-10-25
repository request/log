
var c = require('chalk')
var json = require('prettyjson')

// req, res | http, raw | body, json
var debug = {}
if (process.env.DEBUG) {
  process.env.DEBUG.split(',').forEach(function (key) {
    debug[key] = true
  })
}

var opt = {
  keysColor: 'blue',
  stringColor: 'grey'
}


function log (req) {
  var _options // raw options

  req.on('options', function (options) {
    _options = options
    if (debug.raw) {
      console.log(c.gray.inverse('options'))
      console.log(json.render(options, opt, 4))
    }
  })

  req.on('request', function (req, options) {
    if (debug.http) {
      console.log(c.gray.inverse('options'))
      console.log(json.render(options, opt, 4))
    }

    if (debug.req) {
      var mt = method(req.method)
      console.log(c.cyan.inverse('req'), mt(req.method), c.yellow(uri(req)))

      var headers = {}
      for (var key in req._headerNames) {
        var name = req._headerNames[key]
        headers[name] = req._headers[key]
      }
      console.log(json.render(headers, opt, 4))
    }

    if (debug.body) {
      if (_options.body) {
        console.log(c.gray.inverse('body'))
        if (_options.multipart) {
          multipart(_options)
        }
        else {
          console.log(_options.body)
        }
      }
    }
  })

  req.on('onresponse', function (res) {
    var code = res.statusCode

    var st = status(res.statusCode)
    if (debug.res) {
      console.log(
        c.yellow.inverse('res'), st(res.statusCode + ' ' + res.statusMessage))
      console.log(json.render(res.headers, opt, 4))
    }
  })

  req.on('body', function (body) {
    if (debug.body) {
      if (body) {
        console.log(c.gray.inverse('body'))
        console.log(body)
      }
    }
  })

  req.on('json', function (body) {
    if (debug.json) {
      if (body) {
        console.log(c.gray.inverse('json'))
        console.log(json.render(body, opt, 4))
      }
    }
  })
}

function method (verb) {
  if (/GET/.test(verb)) {
    return c.green
  }
  else if (/POST/.test(verb)) {
    return c.cyan
  }
  else if (/PUT/.test(verb)) {
    return c.cyan
  }
  else if (/DELETE/.test(verb)) {
    return c.red
  }
  else if (/HEAD|OPTIONS|CONNECT/.test(verb)) {
    return c.yellow
  }
  else if (/TRACE/.test(verb)) {
    return c.gray
  }
}

function uri (req) {
  return req.agent.protocol + '//' + req._headers.host +
    (req.path === '/' ? '' : req.path)

  // return url.format({
  //   protocol: req.agent.protocol,
  //   host: req._headers.host,
  //   pathname: (req.path === '/' ? '' : req.path)
  // })
}

function status (code) {
  if (code >= 100 && code <= 199) {
    return c.white
  }
  else if (code >= 200 && code <= 299) {
    return c.green
  }
  else if (code >= 300 && code <= 399) {
    return c.yellow
  }
  else if (code >= 400 && code <= 499) {
    return c.red
  }
  else if (code >= 500 && code <= 599) {
    return c.red.bold
  }
}

function multipart (_options) {
  var header = _options.headers.get('content-type')
  var boundary = header.replace(/.*boundary=([^\s;]+).*/, '$1')

  _options.body._items.forEach(function (item) {
    // file system
    if (item.hasOwnProperty('fd')) {
      console.log(c.blue('fs'), c.yellow(item.path))
    }
    // @http/core
    else if (item._client) {
      var mt = method(item._req.method)
      var url = _options.protocol+'//'+item._req._headers.host + item._req.path
      console.log(
        c.blue('@http/core'), mt(item._req.method), c.yellow(url))
    }
    else {
      item.split('\r\n').forEach(function (line) {
        if (line.indexOf(boundary) !== -1) {
          console.log(c.grey(line))
        }
        else {
          console.log(line)
        }
      })
    }
  })
}

module.exports = log
