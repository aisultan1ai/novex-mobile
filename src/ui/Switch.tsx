import { Switch as RNSwitch, type SwitchProps as RNSwitchProps } from 'react-native';

import { useColors } from './theme';

export interface SwitchProps extends Omit<RNSwitchProps, 'trackColor' | 'thumbColor'> {
  accessibilityLabel: string;
}

/** Нативный переключатель: включён — navy (в тёмной теме — cyan) (DESIGN-TZ 4). */
export function Switch({ accessibilityLabel, ...rest }: SwitchProps) {
  const colors = useColors();
  return (
    <RNSwitch
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: colors.strong, false: colors.lineStrong }}
      ios_backgroundColor={colors.lineStrong}
      {...rest}
    />
  );
}
