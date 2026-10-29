import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultQuoteForm, type QuoteFormValues } from './quoteForm';

interface QuoteDraftState {
  /** Последние параметры расчёта: возвращаясь на вкладку, клиент видит свою форму, а не пустую. */
  form: QuoteFormValues;
  save: (form: QuoteFormValues) => void;
}

export const useQuoteDraft = create<QuoteDraftState>()(
  persist(
    (set) => ({
      form: defaultQuoteForm,
      save: (form) => set({ form }),
    }),
    {
      name: 'novex.quoteDraft',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ form }) => ({ form }),
    },
  ),
);
