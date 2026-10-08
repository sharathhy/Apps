/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { legalDocs } from '../content.generated';
import { parseInline, parseMarkdown } from '../markdown';

const docsDir = join(__dirname, '../../../../../../docs/legal');

describe('legal drafts', () => {
  it.each([
    ['privacy', 'privacy-policy.md'],
    ['terms', 'terms-of-service.md'],
    ['disclaimer', 'medical-disclaimer.md'],
  ] as const)('%s matches docs/legal (run pnpm gen:legal if this fails)', (id, file) => {
    expect(legalDocs[id]).toBe(readFileSync(join(docsDir, file), 'utf8'));
  });

  it('every draft is marked for legal review and carries the medical disclaimer', () => {
    for (const source of Object.values(legalDocs)) {
      expect(source).toMatch(/DRAFT — for legal review/);
    }
    expect(legalDocs.disclaimer).toContain(
      'This app does not provide medical advice, diagnosis, or treatment. Consult a qualified healthcare professional.',
    );
  });
});

describe('parseMarkdown', () => {
  it('reads headings, notes, lists, tables and paragraphs', () => {
    const blocks = parseMarkdown(
      '# Title\n\n> note\n\n## Part\n- a\n- b\n\n1. one\n2. two\n\n| A | B |\n| --- | --- |\n| x | y |\n\nline one\nline two',
    );
    expect(blocks).toEqual([
      { kind: 'heading', level: 1, text: 'Title' },
      { kind: 'note', text: 'note' },
      { kind: 'heading', level: 2, text: 'Part' },
      { kind: 'list', ordered: false, items: ['a', 'b'] },
      { kind: 'list', ordered: true, items: ['one', 'two'] },
      { kind: 'table', header: ['A', 'B'], rows: [['x', 'y']] },
      { kind: 'paragraph', text: 'line one\nline two' },
    ]);
  });

  it('splits bold runs', () => {
    expect(parseInline('a **b** `c`')).toEqual([
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ]);
  });
});
