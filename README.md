# renders [![Flattr this!](https://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=hughskennedy&url=http://github.com/hughsk/renders&title=renders&description=hughsk/renders%20on%20GitHub&language=en_GB&tags=flattr,github,javascript&category=software)[![experimental](http://hughsk.github.io/stability-badges/dist/experimental.svg)](http://github.com/hughsk/stability-badges) #

A local development server for fragment shaders inspired by
[beefy](http://github.com/chrisdickinson/beefy) and
[GLSL Sandbox](http://glsl.heroku.com/). Works out of the box
with [glslify](http://github.com/chrisdickinson/glslify) too.

Created for two reasons:

1. The GLSL sandbox is a really nice way to get familiar with shaders,
   but it's nice to be able to edit your shader in a separate window,
   using your own editor.
2. [glslify](http://github.com/chrisdickinson/glslify) needs a similar
   tool for newcomers to get started quickly and muck around with the
   basics. Would also be nice to have a web-based client for this similar
   to [requirebin](http://requirebin.com/) down the track.

## Usage

[![renders](https://nodei.co/npm/renders.png?mini=true)](https://nodei.co/npm/renders)

Install the renders command-line tool using [npm](http://npmjs.org/):

``` bash
npm install -g renders
```

And simply point it towards a fragment shader file – anything that works
in GLSL sandbox should work here too.

```
Usage:
  renders {options} <fragment shader>

  View and edit GLSL fragment shaders in your browser, with speedy
  real time updates on save.

  Shaders are compiled with glslify, which lets you use modules
  from npm as reusable bits of shader code. See:
  http://github.com/chrisdickinson/glslify

Options:
  -o, --open  Automatically opens the shader viewer in your browser.
  -p, --port  Specifies the port to listen to.

Uniform Variables:
  <float> time        The current unix time stamp, in seconds.
  <vec2>  mouse       The coordinates of the mouse on the screen, from 0 to 1.
  <vec2>  resolution  The width and height of the shader in pixels.

Varying Variables:
  <vec2>  surfacePosition  The position of the pixel on the screen,
                           from -1 to 1.
```

## License ##

MIT. See [LICENSE.md](http://github.com/hughsk/renders/blob/master/LICENSE.md) for details.

![renders](http://i.imgur.com/DyUlOwE.png)
