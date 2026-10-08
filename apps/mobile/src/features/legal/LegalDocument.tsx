import { Card, Text } from '@wellness/ui';
import { Fragment } from 'react';
import { Text as RNText, View } from 'react-native';

import { parseInline, parseMarkdown, type Block } from './markdown';

function Inline({ text }: { text: string }) {
  return parseInline(text).map((span, i) =>
    span.bold ? (
      // Plain RN text so nested bold keeps the parent's size and color.
      <RNText key={i} className="font-semibold">
        {span.text}
      </RNText>
    ) : (
      <Fragment key={i}>{span.text}</Fragment>
    ),
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'heading':
      return (
        <Text variant={block.level === 1 ? 'title1' : 'title3'} className="mt-2">
          {block.text}
        </Text>
      );
    case 'note':
      return (
        <Card tone="muted">
          <Text variant="footnote" tone="muted">
            <Inline text={block.text} />
          </Text>
        </Card>
      );
    case 'paragraph':
      return (
        <Text>
          <Inline text={block.text} />
        </Text>
      );
    case 'list':
      return (
        <View className="gap-2">
          {block.items.map((item, i) => (
            <View key={i} className="flex-row gap-2">
              <Text tone="muted">{block.ordered ? `${i + 1}.` : '•'}</Text>
              <Text className="flex-1">
                <Inline text={item} />
              </Text>
            </View>
          ))}
        </View>
      );
    case 'table':
      // Tables read poorly on phones, so each row becomes a small card.
      return (
        <View className="gap-2">
          {block.rows.map((row, r) => (
            <Card key={r} tone="muted">
              <Text variant="label">{row[0]}</Text>
              {row.slice(1).map((cell, c) => (
                <Text key={c} variant="footnote" tone="muted">
                  {block.header[c + 1]}: {cell}
                </Text>
              ))}
            </Card>
          ))}
        </View>
      );
  }
}

export function LegalDocument({ source }: { source: string }) {
  return (
    <View className="gap-3">
      {parseMarkdown(source).map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </View>
  );
}
