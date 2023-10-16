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

  sparse() {
    return this.grid.map(
      (x, i) =>
        String.fromCodePoint(i) +
        x.map((y, j) => (y ? String.fromCodePoint(j) : '')).join``
    ).join`▵`
  }

  static desparse(s) {
    let a = s.split`▵`
    let n = a.length
    let g = [...Array(n)].map(() => Array(n).fill(0))
    for (let i in a) {
      let [x, ...t] = a[i]
      let xc = x.codePointAt(0)
      for (let j of t) g[xc][j.codePointAt(0)] = 1
    }
    return g
  }

  static dePx(s) {
    return this.desparse(s)
      .flat()
      .flatMap(x => Array(3).fill(x * 255))
  }

  toUi8() {
    return Uint8ClampedArray.from(
      this.grid.flat().flatMap(x => Array(3).fill(x * 255))
    )
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
