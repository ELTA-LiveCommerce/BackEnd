import { isLanguage, Languages } from '@/shared/types/language';

import { COMMON_EXCEPTIONS } from '../exception';

export const getDefaultLanguage = (): Languages => {
  const defaultLanguage = process.env.DEFAULT_LANGUAGE;
  if (!defaultLanguage) throw COMMON_EXCEPTIONS.INTERNAL_SERVER_ERROR('DEFAULT_LANGUAGE is not set');
  if (!isLanguage(defaultLanguage)) throw COMMON_EXCEPTIONS.INTERNAL_SERVER_ERROR('DEFAULT_LANGUAGE is not valid');
  return defaultLanguage;
};
