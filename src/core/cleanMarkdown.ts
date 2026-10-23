import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { mathToText } from './mathToText'

export type LinkMode = 'text' | 'domain' | 'remove'

interface MarkdownNode {
  type: string
  value?: string
  url?: string
  alt?: string | null
  ordered?: boolean | null
  start?: number | null
  checked?: boolean | null
  children?: MarkdownNode[]
}

const parser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)

// Normalize TeX delimiters without changing fenced code blocks.

function normalizeMathDelimiters(input: string): string {
  const parts = input.split(/(^[ \t]*(?:```|~~~)[^\n]*(?:\n|$))/gm)
  let inCodeBlock = false

  return parts
    .map((part) => {
      if (/^[ \t]*(?:```|~~~)/.test(part)) {
        inCodeBlock = !inCodeBlock
        return part
      }

      if (inCodeBlock) return part

      // Protect inline code before normalizing math delimiters.
      const codeSpans: string[] = []
      const protectedPart = part.replace(/(`+)[\s\S]*?\1/g, (codeSpan) => {
        const token = `\u0000INLINE_CODE_${codeSpans.length}\u0000`
        codeSpans.push(codeSpan)
        return token
      })

      const normalized = protectedPart
        .replace(/\\{2,}\(/g, '\\(')
        .replace(/\\{2,}\)/g, '\\)')
        .replace(/\\{2,}\[/g, '\\[')
        .replace(/\\{2,}\]/g, '\\]')
        .replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula: string) =>
          '$' + formula + '$',
        )
        .replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula: string) =>
          '$$' + formula + '$$',
        )

      return normalized.replace(
        /\u0000INLINE_CODE_(\d+)\u0000/g,
        (_match, index: string) => codeSpans[Number(index)] ?? '',
      )
    })
    .join('')
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

function processBareUrls(text: string, mode: LinkMode): string {
  if (mode === 'text') return text

  return text.replace(
    /\bhttps?:\/\/[^\s<>"')\]]+/gi,
    (match) => {
      const punctuation = match.match(/[.,!?;:]+$/)?.[0] ?? ''
      const url = punctuation
        ? match.slice(0, -punctuation.length)
        : match

      if (mode === 'remove') return punctuation

      return `${getDomain(url) || url}${punctuation}`
    },
  )
}

function renderInline(node: MarkdownNode, mode: LinkMode): string {
  const children = node.children ?? []

  switch (node.type) {
    case 'text':
      return processBareUrls(node.value ?? '', mode)

    case 'inlineCode':
      return node.value ?? ''

    case 'inlineMath':
      return mathToText(node.value ?? '')

    case 'link':
      if (mode === 'remove') return ''

      if (mode === 'domain') {
        return (
          getDomain(node.url ?? '') ||
          children.map((child) => renderInline(child, mode)).join('')
        )
      }

      return children.map((child) => renderInline(child, mode)).join('')

    case 'image':
      return node.alt ?? ''

    case 'break':
      return '\n'

    case 'html':
      return (node.value ?? '').replace(/<[^>]*>/g, '')

    default:
      return children.map((child) => renderInline(child, mode)).join('')
  }
}

function renderTable(node: MarkdownNode, mode: LinkMode): string {
  const rows = node.children ?? []
  if (rows.length === 0) return ''

  const headers = (rows[0].children ?? []).map((cell) =>
    (cell.children ?? [])
      .map((child) => renderInline(child, mode))
      .join('')
      .trim(),
  )

  const output: string[] = []

  for (const row of rows.slice(1)) {
    const cells = (row.children ?? []).map((cell) =>
      (cell.children ?? [])
        .map((child) => renderInline(child, mode))
        .join('')
        .trim(),
    )

    if (!cells.some(Boolean)) continue

    const label = headers[0] || 'Item'
    output.push(`${label}: ${cells[0] ?? ''}`)

    for (let i = 1; i < Math.max(headers.length, cells.length); i++) {
      const heading = headers[i] || `Column ${i + 1}`
      const value = cells[i] ?? ''

      if (value) output.push(`- ${heading}: ${value}`)
    }

    output.push('')
  }

  return output.join('\n').trimEnd()
}

function renderList(node: MarkdownNode, mode: LinkMode): string {
  const items = node.children ?? []
  const start = node.start ?? 1

  return items
    .map((item, index) => {
      const parts = (item.children ?? [])
        .map((child) =>
          child.type === 'list'
            ? renderList(child, mode)
            : renderBlock(child, mode).trim(),
        )
        .filter(Boolean)

      const content = parts.join('\n')
      const marker =
        item.checked === true
          ? '☑ '
          : item.checked === false
            ? '☐ '
            : node.ordered
              ? `${start + index}. `
              : '- '

      return content
        .split('\n')
        .map((line, lineIndex) =>
          lineIndex === 0 ? `${marker}${line}` : `  ${line}`,
        )
        .join('\n')
    })
    .join('\n')
}

function renderBlock(node: MarkdownNode, mode: LinkMode): string {
  const children = node.children ?? []

  switch (node.type) {
    case 'root':
      return children.map((child) => renderBlock(child, mode)).join('')

    case 'paragraph':
    case 'heading':
      return `${children.map((child) => renderInline(child, mode)).join('')}\n\n`

    case 'blockquote':
      return `${children.map((child) => renderBlock(child, mode)).join('').trim()}\n\n`

    case 'list':
      return `${renderList(node, mode)}\n\n`

    case 'table':
      return `${renderTable(node, mode)}\n\n`

    case 'code':
      return `${node.value ?? ''}\n\n`

    case 'math':
      return `${mathToText(node.value ?? '')}\n\n`

    case 'thematicBreak':
    case 'definition':
      return ''

    case 'html':
      return `${(node.value ?? '').replace(/<[^>]*>/g, '')}\n\n`

    default:
      return children.map((child) => renderBlock(child, mode)).join('')
  }
}

export function cleanMarkdown(
  input: string,
  linkMode: LinkMode = 'text',
): string {
  const source = normalizeMathDelimiters(
    input.replace(/\r\n?/g, '\n'),
  )

  const tree = parser.parse(source) as unknown as MarkdownNode
  const output = renderBlock(tree, linkMode)

  const cleaned = output
  .replace(/[ \t]+\n/g, '\n')
  .replace(/[ \t]+([.,!?;:])/g, '$1')
  .replace(/[:;,]+([.!?])/g, '$1')
  .replace(/(\S) {2,}(?=\S)/g, '$1 ')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

return linkMode === 'remove'
  ? cleaned.replace(/,\s*(?:und|oder)\s*(?=[.!?]|$)/gi, '')
  : cleaned
}