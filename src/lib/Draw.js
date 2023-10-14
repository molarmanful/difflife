import * as twgl from 'twgl.js'

import opts from '$lib/opts.js'

export default class {
  constructor(gl, n = opts.size) {
    this.gl = gl
    this.progI = twgl.createProgramInfo(gl, [
      `
      attribute vec4 a_pos;
      attribute vec2 a_texc;
      varying vec2 v_texc;
      void main() {
          gl_Position = a_pos;
          v_texc = a_texc;
      }
      `,
      `
      precision mediump float;
      uniform sampler2D u_tex;
      varying vec2 v_texc;
      void main() {
          gl_FragColor = texture2D(u_tex, v_texc);
      }
      `,
    ])

    this.bufI = twgl.createBufferInfoFromArrays(gl, {
      a_pos: {
        numComponents: 2,
        data: [-1, 1, -1, -1, 1, 1, 1, 1, -1, -1, 1, -1],
      },
      a_texc: {
        numComponents: 2,
        data: [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1],
      },
    })

    this.tex = twgl.createTexture(gl, {
      format: gl.RGB,
      src: Array(n * n * 3).fill(0),
    })

    this.n = n
  }

  draw(grid) {
    this.gl.viewport(0, 0, this.n, this.n)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    this.gl.useProgram(this.progI.program)

    twgl.setBuffersAndAttributes(this.gl, this.progI, this.bufI)
    twgl.setTextureFromArray(this.gl, this.tex, grid, {
      format: this.gl.RGB,
    })
    twgl.setUniforms(this.progI, {
      u_tex: this.tex,
    })

    twgl.drawBufferInfo(this.gl, this.bufI)
  }
}
