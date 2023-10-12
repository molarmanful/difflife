export const chunk = (s, n) => {
  let a = []
  for (let i = 0; i < s.length; i += n) a.push(s.slice(i, i + n))
  return a
}

export const deRLE = (s, n) =>
  chunk(
    chunk(s, 2).flatMap(([a, b]) => Array(b.codePointAt(0)).fill(+a)),
    n
  )
