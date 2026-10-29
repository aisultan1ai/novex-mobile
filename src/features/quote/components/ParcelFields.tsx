import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { fieldError } from '@/lib/forms';
import { TextField, spacing } from '@/ui';

import type { QuoteFormValues } from '../quoteForm';

type NumericField = 'weightKg' | 'quantity' | 'widthCm' | 'heightCm' | 'depthCm';

/** Вес, количество мест и (для посылки) габариты. Числовая клавиатура, запятая допустима. */
export function ParcelFields({ form }: { form: UseFormReturn<QuoteFormValues> }) {
  const { t } = useTranslation();
  const isDoc = useWatch({ control: form.control, name: 'shipmentType' }) === 'document';

  const field = (name: NumericField, label: string, decimal = true) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field: f, fieldState }) => (
        <TextField
          ref={f.ref}
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
      {isDoc ? null : (
        <View style={styles.row}>
          {field('widthCm', t('quote.width'))}
          {field('heightCm', t('quote.height'))}
          {field('depthCm', t('quote.depth'))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
});
