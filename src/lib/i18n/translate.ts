import i18n from "lib/i18n";
import { TOptions } from "i18next";
import { TranslationKeys } from "./dictionaries/types";
import { LanguageCode } from "./dictionaries/dictionary";

type TranslatedDescriptions = { en: string } & Partial<Record<LanguageCode, string>>;

export const translate = (
  key: TranslationKeys,
  options: TOptions = {},
): string => {
  return i18n.t(key, options);
};

export const translateTerms = (
  translations: TranslatedDescriptions,
): string => {
  const language = (i18n.language ?? "en") as LanguageCode;

  return translations[language] ?? translations.en;
};
