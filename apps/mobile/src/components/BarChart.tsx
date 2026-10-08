import { Text, useTheme } from '@wellness/ui';
import { View } from 'react-native';

export interface Bar {
  key: string;
  /** Short label under the bar; omit to show none (e.g. on a 30-day chart). */
  label?: string;
  value: number;
}

interface BarChartProps {
  data: Bar[];
  /** Draws a dashed reference line, e.g. the person's own goal. */
  reference?: number | null;
  height?: number;
  color?: string;
  /** One sentence describing the chart for screen readers. */
  summary: string;
}

/**
 * A simple, accessible bar chart drawn with views. Screen readers get the
 * summary instead of individual bars.
 */
export function BarChart({ data, reference, height = 140, color, summary }: BarChartProps) {
  const { colors } = useTheme();
  const max = Math.max(1, reference ?? 0, ...data.map((d) => d.value));
  const fill = color ?? colors.primary;
  const refTop = reference ? height - (reference / max) * height : null;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary} className="gap-1">
      <View style={{ height }} className="flex-row items-end gap-1">
        {refTop !== null ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: refTop,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.textMuted,
            }}
          />
        ) : null}
        {data.map((d) => (
          <View key={d.key} className="flex-1 items-center justify-end" style={{ height }}>
            <View
              style={{
                height: Math.max(d.value > 0 ? 3 : 0, (d.value / max) * height),
                backgroundColor: fill,
                width: '70%',
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
              }}
            />
          </View>
        ))}
      </View>
      {data.some((d) => d.label) ? (
        <View className="flex-row gap-1" importantForAccessibility="no-hide-descendants">
          {data.map((d) => (
            <Text key={d.key} variant="caption" tone="muted" className="flex-1 text-center">
              {d.label ?? ''}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
