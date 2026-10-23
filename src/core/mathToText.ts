const numberSets: Record<string, string> = {
  N: 'ℕ',
  Z: 'ℤ',
  Q: 'ℚ',
  R: 'ℝ',
  C: 'ℂ',
}

const symbols: Record<string, string> = {
  in: '∈',
  notin: '∉',
  ni: '∋',
  subset: '⊂',
  subseteq: '⊆',
  supset: '⊃',
  supseteq: '⊇',
  cup: '∪',
  cap: '∩',
  times: '×',
  cdot: '·',
  pm: '±',
  mp: '∓',
  le: '≤',
  leq: '≤',
  ge: '≥',
  geq: '≥',
  neq: '≠',
  ne: '≠',
  approx: '≈',
  equiv: '≡',
  forall: '∀',
  exists: '∃',
  to: '→',
  rightarrow: '→',
  leftarrow: '←',
  Rightarrow: '⇒',
  Leftarrow: '⇐',
  Leftrightarrow: '⇔',
  iff: '⇔',
  infinity: '∞',
  emptyset: '∅',
  varnothing: '∅',
  land: '∧',
  lor: '∨',
  neg: '¬',
  partial: '∂',
  nabla: '∇',
  sum: '∑',
  prod: '∏',
  int: '∫',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  theta: 'θ',
  lambda: 'λ',
  mu: 'μ',
  pi: 'π',
  sigma: 'σ',
  omega: 'ω',
  Gamma: 'Γ',
  Delta: 'Δ',
  Theta: 'Θ',
  Lambda: 'Λ',
  Sigma: 'Σ',
  Omega: 'Ω',
  left: '',
  right: '',
  quad: ' ',
  qquad: ' ',
  cdots: '…',
  ldots: '…',
  dots: '…',
  displaystyle: '',
  limits: '',
  nolimits: '',
}

const superscripts: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  n: 'ⁿ',
  i: 'ⁱ',
}

const subscripts: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
}

function convertScript(value: string, map: Record<string, string>, marker: string): string {
  const chars = [...value]

  if (chars.every((char) => map[char])) {
    return chars.map((char) => map[char]).join('')
  }

  return `${marker}(${value})`
}

export function mathToText(input: string): string {
  let text = input

  // Fix duplicated backslashes found in some copied LaTeX.
  text = text.replace(/\\{2,}(?=[A-Za-z])/g, '\\')

  // Handle common number sets, including a known typo.
  text = text.replace(
    /\\mathbbi?\s*\{([N Z Q R C])\}/g,
    (_match, name: string) => numberSets[name.trim()] ?? name,
  )

  // Convert fractions and roots from the inside out.
  for (let i = 0; i < 5; i++) {
    text = text.replace(
        /\\(?:dfrac|tfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
        '($1)/($2)',
    )
    text = text.replace(
      /\\sqrt\s*\{([^{}]*)\}/g,
      '√($1)',
    )
  }

  text = text.replace(
    /\\(?:text|mathrm|mathbf|mathit|mathsf|mathtt|operatorname|mathcal|mathscr)\s*\{([^{}]*)\}/g,
    '$1',
  )

  text = text.replace(
    /\\([A-Za-z]+)/g,
    (_match, command: string) => {
      if (symbols[command] !== undefined) return symbols[command]
      return command
    },
  )

  text = text.replace(/\\([{}%_&#$])/g, '$1')

  text = text.replace(
    /\^\{([^{}]+)\}/g,
    (_match, value: string) => convertScript(value, superscripts, '^'),
  )
  text = text.replace(
    /_\{([^{}]+)\}/g,
    (_match, value: string) => convertScript(value, subscripts, '_'),
  )

  text = text.replace(
    /\^([A-Za-z0-9])/g,
    (_match, value: string) => superscripts[value] ?? `^${value}`,
  )
  text = text.replace(
    /_([A-Za-z0-9])/g,
    (_match, value: string) => subscripts[value] ?? `_${value}`,
  )

  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*([=<>+])/g, ' $1')
    .replace(/([=<>+])\s*/g, '$1 ')
    .trim()
}
