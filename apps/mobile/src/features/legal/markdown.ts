/** The small subset of Markdown used by the legal drafts. */
export type Block =
  | { kind: 'heading'; level: 1 | 2; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'table'; header: string[]; rows: string[][] };

export type Span = { text: string; bold: boolean };

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ kind: 'heading', level: 2, text: trimmed.slice(3) });
      i++;
    } else if (trimmed.startsWith('# ')) {
      blocks.push({ kind: 'heading', level: 1, text: trimmed.slice(2) });
      i++;
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ kind: 'note', text: trimmed.slice(2) });
      i++;
    } else if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('|')) tableLines.push(lines[i++]!);
      const [header = [], , ...rows] = tableLines.map(cells);
      blocks.push({ kind: 'table', header, rows });
    } else if (/^(- |\d+\. )/.test(trimmed)) {
      const ordered = /^\d+\. /.test(trimmed);
      const items: string[] = [];
      while (i < lines.length && /^(- |\d+\. )/.test(lines[i]!.trim())) {
        items.push(lines[i++]!.trim().replace(/^(- |\d+\. )/, ''));
      }
      blocks.push({ kind: 'list', ordered, items });
    } else {
      const para: string[] = [];
      while (
        i < lines.length &&
        lines[i]!.trim() &&
        !/^(#|>|\||- |\d+\. )/.test(lines[i]!.trim())
      ) {
        para.push(lines[i++]!.trim());
      }
      blocks.push({ kind: 'paragraph', text: para.join('\n') });
    }
  }
  return blocks;
}

/** Splits `**bold**` runs and drops inline code backticks. */
export function parseInline(text: string): Span[] {
  return text
    .replace(/`/g, '')
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}
