import { ClipboardPaste, Sparkles } from 'lucide-react-native';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { CityField } from '@/features/cities/CityField';
import { fieldError } from '@/lib/forms';
import { Chip, Text, TextField, motion, radii, spacing, useColors } from '@/ui';

import type { AddressFormValues } from './addressForm';
import { useSmartPaste, type UseSmartPasteOptions } from './useSmartPaste';

export interface AddressFieldsProps extends UseSmartPasteOptions {
  form: UseFormReturn<AddressFormValues>;
}

/** Поля адреса со Smart Paste. Используется в оформлении (отправитель / получатель) и адресной книге. */
export function AddressFields({ form, onPhone }: AddressFieldsProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const paste = useSmartPaste(form, { onPhone });
  const { control, formState } = form;
  const err = (name: keyof AddressFormValues) => fieldError(t, formState.errors[name]);

  return (
    <View style={styles.root}>
      {paste.clipboardHasText && !paste.result ? (
        <View style={styles.pasteRow}>
          <Chip
            icon={ClipboardPaste}
            label={t('address.pasteFromClipboard')}
            accessibilityHint={t('address.pasteHint')}
            onPress={() => void paste.pasteFromClipboard()}
          />
        </View>
      ) : null}

      {paste.result ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(motion.normal)}
          exiting={reduceMotion ? undefined : FadeOut.duration(motion.fast)}
          accessibilityLiveRegion="polite"
          style={[styles.banner, { backgroundColor: colors.subtle }]}
        >
          <Sparkles color={colors.icon} size={18} strokeWidth={1.75} />
          <Text variant="label" style={styles.bannerText}>
            {t('address.pasted')}
          </Text>
          <Pressable
            onPress={paste.undo}
            accessibilityRole="button"
            hitSlop={spacing.sm}
            style={styles.undo}
          >
            <Text variant="label" style={{ color: colors.primary }}>
              {t('common.undo')}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <Controller
        control={control}
        name="city"
        render={({ field }) => (
          <CityField
            label={t('address.city')}
            placeholder={t('address.cityPlaceholder')}
            value={field.value}
            onChange={field.onChange}
            error={err('city')}
          />
        )}
      />
      <Controller
        control={control}
        name="street"
        render={({ field }) => (
          <TextField
            ref={field.ref}
            label={t('address.street')}
            placeholder={t('address.streetPlaceholder')}
            hint={t('address.streetHint')}
            value={field.value}
            onChangeText={paste.onStreetChangeText}
            onBlur={field.onBlur}
            error={err('street')}
            autoCapitalize="words"
            textContentType="streetAddressLine1"
            autoComplete="street-address"
          />
        )}
      />
      <View style={styles.row}>
        <Controller
          control={control}
          name="house"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('address.house')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={err('house')}
              autoCapitalize="characters"
            />
          )}
        />
        <Controller
          control={control}
          name="apartment"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('address.apartment')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={err('apartment')}
            />
          )}
        />
      </View>
      <View style={styles.row}>
        <Controller
          control={control}
          name="entrance"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('address.entrance')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="number-pad"
              error={err('entrance')}
            />
          )}
        />
        <Controller
          control={control}
          name="floor"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t('address.floor')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="number-pad"
              error={err('floor')}
            />
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  pasteRow: { flexDirection: 'row' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.button,
  },
  bannerText: { flex: 1 },
  undo: { paddingHorizontal: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
});
