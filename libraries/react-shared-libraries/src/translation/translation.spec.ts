import fs from 'fs';
import path from 'path';
import { fallbackLng, languages } from './i18n.config';

describe('Translation locales integrity', () => {
  const localesDir = path.join(__dirname, 'locales');
  const enPath = path.join(localesDir, fallbackLng, 'translation.json');
  const enKeys = Object.keys(JSON.parse(fs.readFileSync(enPath, 'utf-8')));

  it('configures English as fallback language and includes at least 14 locales', () => {
    expect(fallbackLng).toBe('en');
    expect(languages.length).toBeGreaterThanOrEqual(14);
  });

  it('ensures every locale directory contains valid JSON and all English keys', () => {
    const dirs = fs
      .readdirSync(localesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const locale of dirs) {
      const filePath = path.join(localesDir, locale, 'translation.json');
      expect(fs.existsSync(filePath)).toBe(true);
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const missingKeys = enKeys.filter((k) => !(k in parsed));
      expect({ locale, missingKeys }).toEqual({ locale, missingKeys: [] });
    }
  });
});
