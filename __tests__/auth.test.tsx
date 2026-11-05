import '@/i18n';
import { act, fireEvent } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderRouter, screen } from 'expo-router/testing-library';
import type { ReactNode } from 'react';

import AuthLayout from '../app/(auth)/_layout';
import ForgotPasswordRoute from '../app/(auth)/forgot-password';
import RegisterRoute from '../app/(auth)/register';
import ResetPasswordRoute from '../app/(auth)/reset-password';
import SignInRoute from '../app/(auth)/sign-in';
import VerifyEmailRoute from '../app/(auth)/verify-email';
import * as auth from '@/api/endpoints/auth';
import { ApiError } from '@/api/errors';
import { registerSchema, toRegisterRequest, type RegisterValues } from '@/features/auth/authForms';
import i18n from '@/i18n';
import { createQueryClient } from '@/lib/queryClient';
import { useSessionStore } from '@/store/session';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => undefined),
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));

jest.mock('@/api/endpoints/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
}));
const mocked = jest.mocked(auth);

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
);

const routes = {
  index: () => null,
  '(auth)/_layout': AuthLayout,
  '(auth)/sign-in': SignInRoute,
  '(auth)/register': RegisterRoute,
  '(auth)/forgot-password': ForgotPasswordRoute,
  '(auth)/verify-email': VerifyEmailRoute,
  '(auth)/reset-password': ResetPasswordRoute,
};

const valid: RegisterValues = {
  customerType: 'individual',
  fullName: ' Айгерим Сапарова ',
  companyName: 'не отправится',
  email: ' Aigerim@Mail.KZ ',
  phone: '87010000000',
  taxId: '900101300123',
  password: 'secret-pass',
  consent: true,
};

/** Ключи ошибок схемы по полям. */
function issues(values: RegisterValues) {
  const result = registerSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message]));
}

describe('форма регистрации', () => {
  it('частное лицо: телефон в формате +7, email в нижнем регистре, без названия компании', () => {
    expect(issues(valid)).toEqual({});
    expect(toRegisterRequest(valid)).toEqual({
      email: 'aigerim@mail.kz',
      password: 'secret-pass',
      full_name: 'Айгерим Сапарова',
      phone: '+7 701 000 00 00',
      customer_type: 'individual',
      company_name: null,
      tax_id: '900101300123',
      pd_consent: true,
    });
  });

  it('компании нужны название и БИН; согласие обязательно; телефон необязателен', () => {
    expect(
      issues({
        ...valid,
        customerType: 'company',
        companyName: '  ',
        taxId: '123',
        phone: '',
        consent: false,
      }),
    ).toEqual({
      companyName: 'validation.companyRequired',
      taxId: 'validation.bin',
      consent: 'validation.consent',
    });
    expect(toRegisterRequest({ ...valid, phone: ' ', fullName: '' })).toMatchObject({
      phone: null,
      full_name: null,
    });
  });

  it('пароль от 8 символов, неказахстанский номер — ошибка', () => {
    expect(issues({ ...valid, password: 'short', phone: '+1 202 555 0100' })).toEqual({
      password: 'validation.passwordShort',
      phone: 'validation.phone',
    });
  });
});

describe('экраны входа и регистрации', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useSessionStore.setState({ status: 'signedOut' });
    await act(() => i18n.changeLanguage('ru'));
  });

  async function fillRegistration() {
    await fireEvent.changeText(screen.getByLabelText('ИИН'), '9001-0130 0123');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'new@mail.kz');
    await fireEvent.changeText(screen.getByLabelText('Пароль'), 'secret-pass');
    await fireEvent(
      screen.getByLabelText('Я даю согласие на обработку персональных данных'),
      'valueChange',
      true,
    );
  }

  it('«Создать аккаунт» → регистрация → вход тем же паролем → «Подтвердите email»', async () => {
    mocked.register.mockResolvedValue({} as never);
    mocked.login.mockResolvedValue({} as never);
    await renderRouter(routes, { initialUrl: '/sign-in', wrapper });

    await fireEvent.press(screen.getByRole('button', { name: 'Создать аккаунт' }));
    expect(screen.getByRole('header', { name: 'Регистрация' })).toBeTruthy();

    await fillRegistration();
    await fireEvent.press(screen.getByRole('button', { name: 'Создать аккаунт' }));

    expect(mocked.register).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@mail.kz', tax_id: '900101300123', pd_consent: true }),
    );
    expect(mocked.login).toHaveBeenCalledWith('new@mail.kz', 'secret-pass');
    expect(await screen.findByRole('header', { name: 'Подтвердите email' })).toBeTruthy();
    expect(screen.getByText(/new@mail\.kz/)).toBeTruthy();
  });

  it('без согласия запрос не уходит', async () => {
    await renderRouter(routes, { initialUrl: '/register', wrapper });
    await fireEvent.changeText(screen.getByLabelText('ИИН'), '900101300123');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'new@mail.kz');
    await fireEvent.changeText(screen.getByLabelText('Пароль'), 'secret-pass');
    await fireEvent.press(screen.getByRole('button', { name: 'Создать аккаунт' }));

    expect(mocked.register).not.toHaveBeenCalled();
    expect(await screen.findByText(/Без согласия/)).toBeTruthy();
  });

  it('email занят (409) — текст бэкенда и выход ко входу или восстановлению', async () => {
    mocked.register.mockRejectedValue(
      new ApiError('http', 409, 'Пользователь с таким email уже зарегистрирован.'),
    );
    await renderRouter(routes, { initialUrl: '/register', wrapper });
    await fillRegistration();
    await fireEvent.press(screen.getByRole('button', { name: 'Создать аккаунт' }));

    expect(await screen.findByText(/уже зарегистрирован/)).toBeTruthy();
    expect(mocked.login).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Забыли пароль?' }));
    expect(screen.getByRole('header', { name: 'Восстановление пароля' })).toBeTruthy();
  });

  it('«Забыли пароль?» отправляет ссылку и не говорит, есть ли аккаунт', async () => {
    mocked.forgotPassword.mockResolvedValue({} as never);
    await renderRouter(routes, { initialUrl: '/forgot-password', wrapper });

    await fireEvent.changeText(screen.getByLabelText('Email'), ' Me@Mail.kz ');
    await fireEvent.press(screen.getByRole('button', { name: 'Отправить ссылку' }));

    expect(mocked.forgotPassword).toHaveBeenCalledWith('me@mail.kz');
    expect(await screen.findByRole('header', { name: 'Проверьте почту' })).toBeTruthy();
    expect(screen.getByText(/Если аккаунт с адресом me@mail\.kz существует/)).toBeTruthy();
  });

  it('ссылка подтверждения недействительна (401) — объясняет, что делать', async () => {
    mocked.verifyEmail.mockRejectedValue(new ApiError('unauthorized', 401, 'Ссылка устарела'));
    await renderRouter(routes, { initialUrl: '/verify-email?token=used', wrapper });

    expect(await screen.findByRole('header', { name: 'Ссылка недействительна' })).toBeTruthy();
    expect(mocked.verifyEmail).toHaveBeenCalledWith('used');
    expect(screen.getByRole('button', { name: 'Войти' })).toBeTruthy();
  });

  it('новый пароль: пароли должны совпадать, после сохранения — «Войти»', async () => {
    mocked.resetPassword.mockResolvedValue({} as never);
    await renderRouter(routes, { initialUrl: '/reset-password?token=t1', wrapper });

    await fireEvent.changeText(screen.getByLabelText('Новый пароль'), 'new-secret');
    await fireEvent.changeText(screen.getByLabelText('Повторите пароль'), 'other');
    await fireEvent.press(screen.getByRole('button', { name: 'Сохранить пароль' }));
    expect(await screen.findByText('Пароли не совпадают')).toBeTruthy();
    expect(mocked.resetPassword).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Повторите пароль'), 'new-secret');
    await fireEvent.press(screen.getByRole('button', { name: 'Сохранить пароль' }));
    expect(mocked.resetPassword).toHaveBeenCalledWith('t1', 'new-secret');
    expect(await screen.findByRole('header', { name: 'Пароль изменён' })).toBeTruthy();
  });
});
