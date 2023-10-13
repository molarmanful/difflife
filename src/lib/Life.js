import opts from '$lib/opts.js'
import { mod, range } from '$lib/util.js'

export default class {
  constructor(n = opts.size) {
    this.n = n
    this.grid = [...Array(this.n)].map(() => Array(this.n).fill(0))
  }

  sow(n = opts.bias) {
    this.each((i, j) => {
      this.set(i, j, +(Math.random() < n))
    })
  }

  sowR([x, y], r, n = opts.bias) {
    x |= 0
    y |= 0
    let ns = range(-r, r + 1)
    for (let a of ns)
      for (let b of ns)
        if (a * a + b * b <= r * r) this.set(y + a, x + b, +(Math.random() < n))
  }

  next() {
    this.grid = this.each$((x, i, j) => {
      let sum = 0
      let ns = range(-1, 2)
      for (let a of ns) for (let b of ns) sum += this.at(i + a, j + b)
      return (sum == 3) | ((sum == 4) & x)
    })
  }

  rle() {
    let c = 0
    let n = 0
    let o = ''
    this.each$(x => {
      if (x == c) n++
      else {
        if (n) o += c + String.fromCodePoint(n)
        c = x
        n = 1
      }
    })
    if (n) o += c + String.fromCodePoint(n)
    return o
  }

  at(i, j) {
    return this.grid[mod(~~i, this.n)][mod(~~j, this.n)]
  }

  set(i, j, x) {
    this.grid[mod(~~i, this.n)][mod(~~j, this.n)] = +x
  }

  each(f) {
    for (let i in this.grid) for (let j in this.grid[i]) f(+i, +j)
  }

  each$(f) {
    return this.grid.map((x, i) => x.map((y, j) => f(y, i, j)))
  }
}
