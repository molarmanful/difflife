import opts from '$lib/opts.js'

let ss = {}
for (let k of ['idle', 'heal', 'clk', 'cd_clk', 'cd']) ss[k] = Symbol(k)
export { ss }

export default class {
  constructor() {
    this.h = opts.health
    this.hmax = opts.health
    this.d = opts.decay
    this.r = opts.regen
    this.s = ss.idle
  }

  addh() {
    if (this.h < this.hmax) this.h = Math.min(this.h + this.r, this.hmax)
    else this.s = ss.idle
  }

  subh(f) {
    if (this.h > 0) {
      f()
      this.h = Math.max(this.h - this.d, 0)
    } else this.s = ss.cd_clk
  }

  heal() {
    if ([ss.heal, ss.cd].includes(this.s)) this.addh()
  }

  C(f) {
    if ([ss.heal, ss.idle].includes(this.s)) this.s = ss.clk
    if (this.s == ss.clk) this.subh(f)
  }

  UC() {
    switch (this.s) {
      case ss.clk:
        this.s = ss.heal
        break
      case ss.cd_clk:
        this.s = ss.cd
        break
    }
  }
}
