import '@/i18n';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';

import {
  BottomBar,
  Button,
  CarrierLogo,
  Chip,
  GlassSurface,
  ListGroup,
  ListRow,
  RouteCodes,
  SelectableCard,
  Sheet,
  StatTile,
  StatusDot,
  Switch,
  TextField,
  TicketCard,
  Timeline,
  carrierAsset,
} from '@/ui';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));

describe('Button', () => {
  it.each(['primary', 'secondary', 'ghost', 'destructive'] as const)(
    'вариант %s — кнопка с подписью и нажатием',
    async (variant) => {
      const onPress = jest.fn();
      await render(<Button title="Войти" variant={variant} onPress={onPress} />);
      await fireEvent.press(screen.getByRole('button', { name: 'Войти' }));
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('loading — занята и не нажимается', async () => {
    const onPress = jest.fn();
    await render(<Button title="Оформить" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Оформить' });
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  });
});

describe('TextField', () => {
  it('outlined: подпись — accessibilityLabel, ошибка под полем', async () => {
    await render(<TextField label="Email" value="" error="Введите email" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByText('Введите email')).toBeTruthy();
  });

  it('filled: подпись слева, ввод работает', async () => {
    const onChange = jest.fn();
    await render(<TextField variant="filled" label="Вес, кг" value="" onChangeText={onChange} />);
    await fireEvent.changeText(screen.getByLabelText('Вес, кг'), '3,5');
    expect(onChange).toHaveBeenCalledWith('3,5');
  });
});

describe('выбор', () => {
  it('Chip — состояние selected', async () => {
    await render(<Chip label="Посылка" selected onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Посылка' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it('SelectableCard — radio с selected и нажатием', async () => {
    const onPress = jest.fn();
    await render(
      <SelectableCard selected={false} onPress={onPress} accessibilityLabel="CSE Экспресс">
        <RNText>CSE</RNText>
      </SelectableCard>,
    );
    const card = screen.getByRole('radio', { name: 'CSE Экспресс' });
    expect(card.props.accessibilityState).toMatchObject({ selected: false });
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalled();
  });

  it('Switch — роль switch', async () => {
    await render(<Switch accessibilityLabel="Тёмная тема" value={false} onValueChange={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Тёмная тема' })).toBeTruthy();
  });
});

describe('маршрут и статусы', () => {
  it('RouteCodes — коды на экране, диктор читает названия городов', async () => {
    await render(<RouteCodes from="Алматы" to="Астана" size="lg" arrow showCities fromCaption="28 окт" />);
    expect(screen.getByText('ALA')).toBeTruthy();
    expect(screen.getByText('NQZ')).toBeTruthy();
    expect(screen.getByLabelText('Алматы — Астана')).toBeTruthy();
    expect(screen.getByText('28 окт')).toBeTruthy();
  });

  it('StatusDot — текст статуса, не только цвет', async () => {
    await render(<StatusDot status="out_for_delivery" meta="сегодня" />);
    expect(screen.getByText(/Выезд на доставку/)).toBeTruthy();
    expect(screen.getByText(/сегодня/)).toBeTruthy();
  });

  it('Timeline — пункты списком', async () => {
    await render(
      <Timeline
        accessibilityLabel="Статус доставки"
        items={[
          { key: '1', title: 'Курьер везёт посылку', meta: 'Астана · 15:20', current: true },
          { key: '2', title: 'Курьер забрал посылку', meta: 'Алматы · 28 октября' },
        ]}
      />,
    );
    expect(screen.getByLabelText('Курьер везёт посылку, Астана · 15:20')).toBeTruthy();
    expect(screen.getByText('Курьер забрал посылку')).toBeTruthy();
  });
});

describe('перевозчики и заказы', () => {
  it('carrierAsset понимает коды API, сайта и макетов', () => {
    for (const code of ['cse', 'CSE', 'kse', 'exline', 'EXL', 'ex', 'azimuth', 'AZM', 'az']) {
      expect(carrierAsset(code)).not.toBeNull();
    }
    expect(carrierAsset('dhl')).toBeNull();
    expect(carrierAsset('azimuth')?.dark).toBe(true);
  });

  it('CarrierLogo — неизвестный перевозчик рисуется монограммой', async () => {
    await render(<CarrierLogo code="dhl" name="DHL Express" />);
    expect(screen.getByLabelText('DHL Express')).toBeTruthy();
    expect(screen.getByText('DE')).toBeTruthy();
  });

  it('TicketCard — одна кнопка с полным описанием заказа', async () => {
    const onPress = jest.fn();
    await render(
      <TicketCard
        from="Алматы"
        to="Астана"
        citiesLabel="Алматы → Астана"
        status="in_transit"
        date="сегодня"
        carrierCode="cse"
        carrierName="CSE"
        price="5 380 ₸"
        onPress={onPress}
        accessibilityLabel="Алматы — Астана, В пути, 5 380 ₸"
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Алматы — Астана, В пути, 5 380 ₸' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('списки, плитки, панели', () => {
  it('StatTile — нажимаемая плитка (копировать)', async () => {
    const onPress = jest.fn();
    await render(<StatTile label="Трек-номер" value="CSE-7K2M9QX4A1BZ" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Трек-номер: CSE-7K2M9QX4A1BZ' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('ListGroup / ListRow — строки с значением и деструктивная строка', async () => {
    const onLogout = jest.fn();
    await render(
      <ListGroup>
        <ListRow title="Язык" value="Русский" onPress={() => {}} />
        <ListRow title="Выйти" destructive onPress={onLogout} />
      </ListGroup>,
    );
    expect(screen.getByRole('button', { name: 'Язык, Русский' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Выйти' }));
    expect(onLogout).toHaveBeenCalled();
  });

  it('BottomBar — итог, прогресс и CTA', async () => {
    const onPress = jest.fn();
    await render(
      <BottomBar
        totalLabel="Итого"
        total="4 890 ₸"
        progress={0.25}
        cta={{ title: 'Оформить', onPress }}
      />,
    );
    expect(screen.getByLabelText('Итого 4 890 ₸')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Оформить' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('GlassSurface — рисует содержимое', async () => {
    await render(
      <GlassSurface>
        <RNText>внутри</RNText>
      </GlassSurface>,
    );
    expect(screen.getByText('внутри')).toBeTruthy();
  });

  it('Sheet — заголовок, пояснение, действие; затемнение скрыто от диктора (модальный лист)', async () => {
    const onClose = jest.fn();
    await render(
      <Sheet visible title="Выйти из аккаунта?" message="Черновики сохранятся" onClose={onClose} closeLabel="Закрыть">
        <Button title="Остаться" onPress={onClose} />
      </Sheet>,
    );
    expect(screen.getByText('Выйти из аккаунта?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Закрыть' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Остаться' }));
    expect(onClose).toHaveBeenCalled();
  });
});
