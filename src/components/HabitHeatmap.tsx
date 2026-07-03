import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { HeatmapCell } from '../lib/heatmap';
import { type, type ColorPalette, useTheme } from '../theme';

interface HabitHeatmapProps {
  cells: HeatmapCell[];
  color: string;
  weeks?: number;
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const CELL_RADIUS = 2;
const WEEKDAY_LABELS: Record<number, string> = { 1: 'M', 3: 'W', 5: 'F' };
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export default function HabitHeatmap({ cells, color, weeks = 12 }: HabitHeatmapProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const width = weeks * (CELL_SIZE + CELL_GAP) - CELL_GAP;
  const height = WEEKDAYS.length * (CELL_SIZE + CELL_GAP) - CELL_GAP;

  return (
    <View style={styles.row}>
      <View style={styles.labelColumn}>
        {WEEKDAYS.map((weekday, index) => (
          <View key={weekday} style={[styles.labelCell, index < WEEKDAYS.length - 1 && styles.labelCellGap]}>
            <Text style={[type.caption, styles.labelText]}>{WEEKDAY_LABELS[weekday] ?? ''}</Text>
          </View>
        ))}
      </View>

      <Svg width={width} height={height}>
        {cells.map((cell) => {
          const x = cell.weekIndex * (CELL_SIZE + CELL_GAP);
          const y = (cell.weekday - 1) * (CELL_SIZE + CELL_GAP);

          if (cell.isFuture || !cell.scheduled) {
            return <Rect key={cell.date} x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} rx={CELL_RADIUS} fill={colors.bg} />;
          }

          return (
            <Rect
              key={cell.date}
              x={x}
              y={y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={CELL_RADIUS}
              fill={cell.completed ? color : colors.surface}
              stroke={cell.completed ? color : colors.border}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    labelColumn: {
      marginRight: CELL_GAP + 4,
    },
    labelCell: {
      height: CELL_SIZE,
      justifyContent: 'center',
    },
    labelCellGap: {
      marginBottom: CELL_GAP,
    },
    labelText: {
      color: colors.inkMuted,
      fontSize: 10,
      lineHeight: CELL_SIZE,
    },
  });
}
