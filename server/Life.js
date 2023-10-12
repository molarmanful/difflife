import opts from '../common/opts.js'

let mod = (a, b) => ((a % b) + b) % b

export class Life {
  constructor(n = opts.size) {
    this.n = n
    this.grid = [...new Array(this.n)].map(() =>
      [...new Array(this.n)].map(() => 0)
    )
  }

  at(i, j) {
    return this.grid[mod(i, this.n)][mod(j, this.n)]
  }

  each(f) {
    for (let i in this.grid) for (let j in this.grid[i]) f(+i, +j)
  }

  each$(f) {
    return this.grid.map((x, i) => x.map((y, j) => f(y, i, j)))
  }

  sow(n = 0.5) {
    this.each((i, j) => {
      this.grid[i][j] = +(Math.random() < n)
    })
  }

  next() {
    this.grid = this.each$((x, i, j) => {
      let sum = 0
      for (let a of [-1, 0, 1])
        for (let b of [-1, 0, 1]) sum += this.at(i + a, j + b)
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
}
