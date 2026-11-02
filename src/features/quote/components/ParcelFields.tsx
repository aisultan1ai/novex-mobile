import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { fieldError } from '@/lib/forms';
import { TextField, spacing } from '@/ui';

import type { QuoteFormValues } from '../quoteForm';

type NumericField = 'weightKg' | 'quantity' | 'widthCm' | 'heightCm' | 'depthCm';

// iOS — серые плашки «подпись слева, значение справа»; Android — M3 outlined (DESIGN-TZ 6.3, 8).
const VARIANT = Platform.OS === 'android' ? 'outlined' : 'filled';

/** Вес и места; свои габариты — по запросу или если размер не из S/M/L. */
export function ParcelFields({
  form,
  showDims,
}: {
  form: UseFormReturn<QuoteFormValues>;
  showDims: boolean;
}) {
  const { t } = useTranslation();

  const field = (name: NumericField, label: string, decimal = true) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field: f, fieldState }) => (
        <TextField
          ref={f.ref}
          variant={VARIANT}
          label={label}
          value={f.value}
          onChangeText={f.onChange}
          onBlur={f.onBlur}
          error={fieldError(t, fieldState.error)}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          maxLength={7}
          returnKeyType="done"
        />
      )}
    />
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {field('weightKg', t('quote.weight'))}
        {field('quantity', t('quote.quantity'), false)}
      </View>
      {showDims ? (
        <View style={styles.row}>
          {field('widthCm', t('quote.width'))}
          {field('heightCm', t('quote.height'))}
          {field('depthCm', t('quote.depth'))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.xs },
});
