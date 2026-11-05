import { useNavigation, useRoute, useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, X } from 'lucide-react-native';
import { forwardRef, useCallback, useState, type ComponentRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type TextInput } from 'react-native';

import {
  Text,
  TextField,
  sizes,
  spacing,
  useColors,
  useScreenInsets,
  type TextFieldProps,
} from '@/ui';

// Общие части экранов группы (auth): вход, регистрация, восстановление и подтверждение.
// Группа открывается одним модальным окном поверх приложения (app/_layout.tsx).

/** Закрыть всё окно входа; если его открыли ссылкой и закрывать некуда — на главную. */
export function useCloseAuth() {
  const navigation = useNavigation();
  const router = useRouter();
  return useCallback(() => {
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else router.replace('/');
  }, [navigation, router]);
}

/** К экрану входа: вернуться, если он прямо под текущим, иначе открыть его вместо текущего. */
export function useBackToSignIn() {
  const navigation = useNavigation();
  const routeKey = useRoute().key;
  const router = useRouter();
  return useCallback(() => {
    const routes = navigation.getState()?.routes ?? [];
    const position = routes.findIndex((r) => r.key === routeKey);
    if (position > 0 && routes[position - 1]?.name === 'sign-in') router.back();
    else router.replace('/sign-in');
  }, [navigation, routeKey, router]);
}

/** Верх экрана: «Назад» внутри окна, «Закрыть» — на его первом экране. */
export function AuthTopBar() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const close = useCloseAuth();
  // Положение экрана в стеке окна не меняется, пока экран открыт.
  const routeKey = useRoute().key;
  const position =
    useNavigation()
      .getState()
      ?.routes.findIndex((r) => r.key === routeKey) ?? 0;
  const nested = position > 0;

  return (
    <View style={[styles.top, nested ? styles.start : styles.end]}>
      <Pressable
        onPress={nested ? () => router.back() : close}
        accessibilityRole="button"
        accessibilityLabel={nested ? t('common.back') : t('common.close')}
        style={styles.icon}
      >
        {nested ? (
          <ChevronLeft color={colors.text} size={28} strokeWidth={1.75} />
        ) : (
          <X color={colors.text} size={24} strokeWidth={1.75} />
        )}
      </Pressable>
    </View>
  );
}

/** Заголовок и пояснение экрана. */
export function AuthHeading({ title, text }: { title: string; text?: ReactNode }) {
  return (
    <View style={styles.heading}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {text ? (
        <Text tone="muted" style={styles.headingText}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

/** Прокрутка формы: поля поднимаются над клавиатурой, снизу — место под футер. */
export function AuthScroll({ children }: { children: ReactNode }) {
  const insets = useScreenInsets();
  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  );
}

/** Поле пароля с кнопкой «Показать». */
export const PasswordField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(
  function PasswordField(props, ref) {
    const { t } = useTranslation();
    const colors = useColors();
    const [shown, setShown] = useState(false);
    const Icon = shown ? EyeOff : Eye;
    return (
      <TextField
        ref={ref}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        secureTextEntry={!shown}
        accessory={
          <Pressable
            onPress={() => setShown((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={shown ? t('auth.hidePassword') : t('auth.showPassword')}
            style={styles.icon}
          >
            <Icon color={colors.text} size={20} strokeWidth={1.75} />
          </Pressable>
        }
      />
    );
  },
);

const styles = StyleSheet.create({
  top: { flexDirection: 'row' },
  start: { justifyContent: 'flex-start', marginLeft: -spacing.xs },
  end: { justifyContent: 'flex-end' },
  icon: {
    width: sizes.hitTarget,
    height: sizes.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { marginTop: spacing.md },
  headingText: { marginTop: spacing.xs },
  content: { gap: spacing.lg },
});
