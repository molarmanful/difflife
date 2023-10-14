export const msgParse = data => {
  let [h, ...t] = data.split`\n`
  let b = t.join`\n`
  return [h, b]
}

export const chunk = (s, n) => {
  let a = []
  for (let i = 0; i < s.length; i += n) a.push(s.slice(i, i + n))
  return a
}

export const range = (a, b) => [...Array(b - a).keys()].map(x => x + a)

export const mod = (a, b) => ((a % b) + b) % b
