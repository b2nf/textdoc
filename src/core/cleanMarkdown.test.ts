import { describe, expect, it } from 'vitest'
import { cleanMarkdown } from './cleanMarkdown'

describe('cleanMarkdown', () => {
  it('removes common Markdown formatting', () => {
    const input = '# Notes\n\nThis is **bold** and *italic*.'

    expect(cleanMarkdown(input)).toBe(
      'Notes\n\nThis is bold and italic.',
    )
  })

  it('converts Markdown tables into labeled text groups', () => {
    const input = [
      '| Topic | Status |',
      '| --- | --- |',
      '| Markdown | Ready |',
      '| Tables | Supported |',
    ].join('\n')

    expect(cleanMarkdown(input)).toBe(
      'Topic: Markdown\n' +
        '- Status: Ready\n\n' +
        'Topic: Tables\n' +
        '- Status: Supported',
    )
  })

  it('supports all link modes', () => {
    const input =
      'Read the [privacy policy](https://privacy.claude.com/en/articles/example).'

    expect(cleanMarkdown(input, 'text')).toBe(
      'Read the privacy policy.',
    )

    expect(cleanMarkdown(input, 'domain')).toBe(
      'Read the privacy.claude.com.',
    )

    expect(
      cleanMarkdown(
        '[privacy policy](https://privacy.claude.com/en/articles/example)',
        'remove',
      ),
    ).toBe('')
  })

  it('converts common LaTeX formulas to readable text', () => {
    const input = String.raw`Eine ganze Zahl \(n \in \mathbbi{Z}\) heißt **gerade**, wenn es ein \(k \in \mathbb{Z}\) gibt mit \(n = 2k\).`

    expect(cleanMarkdown(input)).toBe(
      'Eine ganze Zahl n ∈ ℤ heißt gerade, wenn es ein k ∈ ℤ gibt mit n = 2k.',
    )
  })

  it('converts fractions, roots and exponents', () => {
    const input = [
      String.raw`The fraction is \(\frac{a+b}{c}\).`,
      '',
      String.raw`A display fraction is \(\dfrac{1}{2}\).`,
      '',
      String.raw`A text fraction is \(\tfrac{x}{y}\).`,
      '',
      String.raw`The square root is \(\sqrt{x}\).`,
      '',
      String.raw`For every \(n \in \mathbb{N}\), we have \(n^2 \geq 0\).`,
    ].join('\n')

    expect(cleanMarkdown(input)).toBe(
      'The fraction is (a + b)/(c).\n\n' +
        'A display fraction is (1)/(2).\n\n' +
        'A text fraction is (x)/(y).\n\n' +
        'The square root is √(x).\n\n' +
        'For every n ∈ ℕ, we have n² ≥ 0.',
    )
  })

  it('preserves fenced code block contents', () => {
    const code = String.raw`\(x \in \mathbb{R}\)`
    const input = [
      '```text',
      '**This must stay unchanged**',
      code,
      '```',
    ].join('\n')

    expect(cleanMarkdown(input)).toBe(
      `**This must stay unchanged**\n${code}`,
    )
  })

  it('keeps nested lists readable', () => {
    const input = [
      '- First item',
      '  - Nested item',
      '- Second item with **bold text**',
    ].join('\n')

    expect(cleanMarkdown(input)).toBe(
      '- First item\n' +
        '  - Nested item\n' +
        '- Second item with bold text',
    )
  })

  it('converts dollar-delimited and display math', () => {
    const input = [
      String.raw`Inline: $x \in \mathbb{R}$.`,
      '',
      String.raw`\[x^2 + y^2 = z^2\]`,
    ].join('\n')

    expect(cleanMarkdown(input)).toBe(
      'Inline: x ∈ ℝ.\n\n' +
        'x² + y² = z²',
    )
  })

  it('preserves math-like text inside inline code', () => {
    const input = 'Use `\\(x \\in \\mathbb{R}\\)` as literal text.'

    expect(cleanMarkdown(input)).toBe(
      'Use \\(x \\in \\mathbb{R}\\) as literal text.',
    )
  })

  it('preserves numbered lists and cleans blockquotes', () => {
    const input = [
      '1. **First item**',
      '2. Second item with *emphasis*',
      '',
      '> A quoted sentence with `inline code`.',
    ].join('\n')

    expect(cleanMarkdown(input)).toBe(
      '1. First item\n' +
        '2. Second item with emphasis\n\n' +
        'A quoted sentence with inline code.',
    )
  })

  it('converts common Greek letters and math symbols', () => {
    const input = String.raw`Let \(\alpha \neq \beta\), and \(a \leq b\). Also, \(a \times b\).`

    expect(cleanMarkdown(input)).toBe(
      'Let α ≠ β, and a ≤ b. Also, a × b.',
    )
  })

  it('converts set notation and comparison symbols', () => {
    const input = String.raw`For \(x \in \mathbb{R}\), \(x \geq 0\) and \(a \approx b\).`

    expect(cleanMarkdown(input)).toBe(
      'For x ∈ ℝ, x ≥ 0 and a ≈ b.',
    )
  })
})