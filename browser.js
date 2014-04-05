var createSSE    = require('sse-stream')
var createShader = require('gl-shader')
var createBuffer = require('gl-buffer')
var debounce     = require('debounce')
var createShell  = require('gl-now')
var createVAO    = require('gl-vao')
var createFBO    = require('gl-fbo')
var split        = require('split')
var xhr          = require('xhr')
var fs           = require('fs')

var defaultVert = fs.readFileSync(__dirname + '/shaders/default.vert', 'utf8')
var surfaceFrag = fs.readFileSync(__dirname + '/shaders/surface.frag', 'utf8')
var error = window.onerror = require('./lib/error')

var resolution = new Float32Array(2)
var mouse      = new Float32Array(2)
var scratch    = new Float32Array(2)
var start      = Date.now()
var sse

/**
 * Rendering
 *
 * Sets up the WebGL context and draws the flat fragment
 * shader to the screen.
 */
var pingpong = true
var vertices
var shader
var t = 0
var shell = createShell({
  clearColor: [0, 0, 0, 1]
})

shell.on('gl-init', function() {
  var gl = shell.gl

  shell.scale = 2
  buffer = createBuffer(gl, new Float32Array([
    -1, -1,  +1, -1,  -1, +1,
    -1, +1,  +1, -1,  +1, +1
  ]))

  updateFBO()

  frameShader = createShader(gl
    , defaultVert
    , surfaceFrag
  )

  vertices = createVAO(gl, [{
    buffer: buffer
    , size: 2
  }])
}).on('gl-render', function() {
  if (!shader) return

  var gl = shell.gl

  // Draw to FBO for shader ping-pong
  if (pingpong) {
    nextFrame.bind()
    gl.viewport(0, 0, nextFrame.width, nextFrame.height)

    if (shell.clearFlags & gl.STENCIL_BUFFER_BIT) gl.clearStencil(shell.clearStencil)
    if (shell.clearFlags & gl.DEPTH_BUFFER_BIT) gl.clearDepth(shell.clearDepth)
    if (shell.clearFlags & gl.COLOR_BUFFER_BIT) gl.clearColor(
        shell.clearColor[0]
      , shell.clearColor[1]
      , shell.clearColor[2]
      , shell.clearColor[3]
    )
    if (shell.clearFlags) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    }
  } else {
    gl.viewport(0, 0, shell.width, shell.height)
  }

  gl.disable(gl.DEPTH_TEST)

  // Set up and draw the user's shader
  shader.bind()
  scratch[0] = shell.width / shell.scale
  scratch[1] = shell.height / shell.scale
  shader.uniforms.resolution = scratch

  scratch[0] = shell.mouseX / scratch[0]
  scratch[1] = shell.mouseY / scratch[1]
  shader.uniforms.mouse = scratch
  shader.uniforms.time = (Date.now() - start) / 1000
  shader.uniforms.backbuffer = prevFrame.color[0].bind(0)

  vertices.bind()
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  vertices.unbind()

  if (!pingpong) return

  // Reset the frame buffer and draw to the canvas
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, shell.width/shell.scale, shell.height/shell.scale)

  frameShader.bind()
  frameShader.uniforms.backbuffer = nextFrame.color[0].bind(0)

  vertices.bind()
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  vertices.unbind()

  // Switch next and previous frames
  prevFrame = nextFrame
})

/**
 * GLSL Live Reload
 *
 * Uses SSE or AJAX polling to pull in updates from
 * the server when a change is detected.
 */
function refresh(body) {
  pingpong = body && body.indexOf('sampler2D') !== -1

  if (body) return shader = createShader(shell.gl
    , defaultVert
    , body
  )

  xhr('/shader', function(err, res, body) {
    if (err) return error(err)
    if (shader) shader.dispose()
    pingpong = body.indexOf('sampler2D') !== -1

    shader = createShader(shell.gl
      , defaultVert
      , body
    )
  })
}

var last = 0

if (typeof EventSource !== 'undefined') {
  sse = createSSE('/-/sse')
  sse.pipe(split()).on('data', function(d) {
    if (!d) return
    if (!(d = String(d).trim())) return

    d = JSON.parse(d)
    if (d.error) return error(d.error)
    if (!d.shader) return
    error.clear()
    refresh(d.shader)
  })
} else {
  console.warn([
      'EventSource not supported, falling back to slower'
    , 'XHR polling method. You should try using Chrome or Firefox'
    , 'or even Opera!'
  ].join(' '))

  iter()
  function iter() {
    xhr('/-/reload', function(err, res, body) {
      try {
        var update = JSON.parse(body)
        if (update.last > last) {
          last = update.last
          refresh()
        }
      } catch(e){}

      setTimeout(iter, 1500)
    })
  }
}

var nextFrame
var prevFrame

shell.on('resize', debounce(function() {
  return updateFBO()
}, 1000))

function updateFBO(width, height) {
  if (nextFrame) nextFrame.dispose()
  if (prevFrame) prevFrame.dispose()
  if (!width)  width = shell.width / shell.scale
  if (!height) height = shell.height / shell.scale
  if (
    nextFrame &&
    nextFrame.width === width &&
    nextFrame.height === height &&
    prevFrame &&
    prevFrame.width === width &&
    prevFrame.height === height
  ) return


  var gl = shell.gl

  nextFrame = createFBO(gl, width, height)
  prevFrame = createFBO(gl, width, height)

  nextFrame.width = prevFrame.width = width
  nextFrame.height = prevFrame.height = height
  nextFrame.color.minFilter = prevFrame.color.minFilter = gl.NEAREST
  nextFrame.color.maxFilter = prevFrame.color.maxFilter = gl.NEAREST
  nextFrame.color.wrapS = prevFrame.color.wrapS = gl.CLAMP_TO_EDGE
  nextFrame.color.wrapT = prevFrame.color.wrapT = gl.CLAMP_TO_EDGE
}
