var combine   = require('stream-combiner')
var glslify   = require('glslify-stream')
var deparser  = require('glsl-deparser')
var createSSE = require('sse-stream')
var watchify  = require('watchify')
var chokidar  = require('chokidar')
var Emitter   = require('events/')
var course    = require('course')
var path      = require('path')
var fs        = require('fs')
var bl        = require('bl')

var files = {
  index: __dirname + '/index.html'
  , src: __dirname + '/browser.js'
}

module.exports = createServer

function createServer(shaderFile, opts) {
  opts = opts || {}

  var sse = createSSE('/-/sse')
  var watcher = chokidar.watch(shaderFile)
  var base = opts.base || null
  var last = Date.now()
  var lastShader = new Buffer('')

  watcher.on('change', function() {
    last = Date.now()

    // Push the shader onto each currently connected
    // client whenever a file change is detected.
    var buffered = bl(function(err, shader) {
      if (err) return handleError(err)

      var data = JSON.stringify({ shader: String(shader) })
      var pool = sse.pool

      for (var i = 0; i < pool.length; i++) {
        pool[i].write(data)
        pool[i].write('\n')
      }

      lastShader = shader
    })

    createShaderStream(shaderFile, true)
      .pipe(buffered)
  })

  // Pipe through the initial shader to each newly
  // connected client.
  sse.on('connection', function(conn) {
    var buffered = bl(function(err, shader) {
      if (err) return handleError(err)

      conn.write(JSON.stringify({ shader: String(shader) }))
      conn.write('\n')

      lastShader = shader
    })

    createShaderStream(shaderFile, true)
      .pipe(buffered)
  })

  return course()
    .get(r('/'), index)
    .get(r('/bundle.js'), bundle())
    .get(r('/shader'), shader)
    .get(r('/-/sse'), sse.handle.bind(sse))
    .get(r('/-/reload'), function(req, res, next) {
      res.end(JSON.stringify({ last: last }))
    })

  function index(req, res, next) {
    res.setHeader('content-type', 'text/html')
    fs.createReadStream(files.index)
      .pipe(res)
  }

  function shader(req, res, next) {
    createShaderStream(shaderFile, true).pipe(res)
  }

  function handleError(err) {
    shader = lastShader

    var data = JSON.stringify({ error: err.message })
    var pool = sse.pool

    for (var i = 0; i < pool.length; i++) {
      pool[i].write(data)
      pool[i].write('\n')
    }

    console.error(err)
  }

  function bundle() {
    var bundler = watchify(files.src)
    var bundled = new Buffer('')
    var pending = null

    rebundle()
    bundler.transform('brfs')
    bundler.on('update', rebundle)
    function rebundle() {
      if (pending) return
      pending = new Emitter

      bundler.bundle().pipe(bl(function(err, data) {
        if (err) return bundler.emit('error', err)
        bundled = data
        pending.emit('bundled')
        pending = null
      }))
    }

    return function(req, res, next) {
      return pending
        ? pending.once('bundled', handle)
        : handle()

      function handle() {
        res.setHeader('content-type', 'application/javascript')
        res.end(bundled)
      }
    }
  }

  function r(route) {
    if (!base) return route
    return path.join(base, route)
  }

  function createShaderStream(file, parse) {
    if (!parse) return fs.createReadStream(file)

    return combine(
        glslify(file)
      , deparser()
    )
  }
}
