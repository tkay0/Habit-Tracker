import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import Button from '../components/Button';
import { radius, spacing, type ColorPalette, type, useTheme } from '../theme';

const SWATCHES: { name: string; hex: keyof ColorPalette }[] = [
  { name: 'bg', hex: 'bg' },
  { name: 'surface', hex: 'surface' },
  { name: 'ink', hex: 'ink' },
  { name: 'inkMuted', hex: 'inkMuted' },
  { name: 'terracotta', hex: 'terracotta' },
  { name: 'moss', hex: 'moss' },
  { name: 'gold', hex: 'gold' },
  { name: 'border', hex: 'border' },
  { name: 'miss', hex: 'miss' },
];

const TYPE_SAMPLES: { label: string; token: keyof typeof type; sample: string }[] = [
  { label: 'display', token: 'display', sample: '128' },
  { label: 'h1', token: 'h1', sample: 'Heading one' },
  { label: 'h2', token: 'h2', sample: 'Heading two' },
  { label: 'h3', token: 'h3', sample: 'Heading three' },
  { label: 'body', token: 'body', sample: 'Body text sits on Manrope for easy reading.' },
  { label: 'label', token: 'label', sample: 'FIELD LABEL' },
  { label: 'caption', token: 'caption', sample: 'Caption text for secondary detail.' },
];

function Section({
  title,
  styles,
  children,
}: {
  title: string;
  styles: ReturnType<typeof createStyles>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[type.label, styles.sectionTitle]}>{title}</Text>
      {children}
    </View>
  );
}

export default function StyleGuideScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [inputValue, setInputValue] = useState('');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[type.display, styles.pageTitle]}>Style Guide</Text>

      <Section title="COLORS" styles={styles}>
        <View style={styles.swatchRow}>
          {SWATCHES.map((swatch) => (
            <View key={swatch.name} style={styles.swatchItem}>
              <View style={[styles.swatch, { backgroundColor: colors[swatch.hex] }]} />
              <Text style={[type.caption, styles.swatchLabel]}>{swatch.name}</Text>
              <Text style={[type.caption, styles.swatchHex]}>{colors[swatch.hex]}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="TYPE SCALE" styles={styles}>
        <View style={styles.typeList}>
          {TYPE_SAMPLES.map((item) => (
            <View key={item.label} style={styles.typeRow}>
              <Text style={[type.caption, styles.typeLabel]}>{item.label}</Text>
              <Text style={[type[item.token], styles.typeSample]}>{item.sample}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="BUTTONS" styles={styles}>
        <View style={styles.buttonGap}>
          <Button label="Primary action" onPress={() => {}} />
        </View>
        <Button label="Secondary action" variant="secondary" onPress={() => {}} />
      </Section>

      <Section title="CARD" styles={styles}>
        <View style={styles.card}>
          <Text style={[type.h3, styles.cardTitle]}>Morning routine</Text>
          <Text style={[type.bodyMuted, styles.cardBody]}>
            Cards use the surface color with a hairline border instead of a shadow.
          </Text>
        </View>
      </Section>

      <Section title="TEXT INPUT" styles={styles}>
        <TextInput
          style={[type.body, styles.textInput]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Add a habit"
          placeholderTextColor={colors.inkMuted}
        />
      </Section>
    </ScrollView>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl * 2,
    },
    pageTitle: {
      color: colors.ink,
      marginBottom: spacing.xl,
      textAlign: 'left',
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      color: colors.inkMuted,
      marginBottom: spacing.base,
      textAlign: 'left',
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.base,
    },
    swatchItem: {
      width: 84,
    },
    swatch: {
      width: 84,
      height: 84,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    swatchLabel: {
      color: colors.ink,
      textAlign: 'left',
    },
    swatchHex: {
      color: colors.inkMuted,
      textAlign: 'left',
    },
    typeList: {
      gap: spacing.base,
    },
    typeRow: {
      gap: spacing.xs,
    },
    typeLabel: {
      color: colors.inkMuted,
      textAlign: 'left',
    },
    typeSample: {
      color: colors.ink,
      textAlign: 'left',
    },
    buttonGap: {
      marginBottom: spacing.base,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
    cardTitle: {
      color: colors.ink,
      marginBottom: spacing.xs,
      textAlign: 'left',
    },
    cardBody: {
      color: colors.inkMuted,
      textAlign: 'left',
    },
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.base,
      color: colors.ink,
    },
  });
}
