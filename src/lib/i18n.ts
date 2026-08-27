import {en, sv, type Locale} from './i18n.dict.js';

export {DEFAULT_LOCALE, languages} from './i18n.dict.js';
export type {Locale} from './i18n.dict.js';

/**
 * Keeps hover info and autocomplete for keys that exist while still compiling
 * for keys that do not. Known keys keep their literal type; anything else falls
 * through the index signature as `Fluid`, so a not-yet-declared path like
 * `req.t.made.up.path` still resolves to a string type.
 */
type Fluid = string & { [key: string]: Fluid; };

type DeepFluid<T> = T extends object
  ? {[K in keyof T]: DeepFluid<T[K]>} & Record<string, Fluid>
  : T;

/**
 * A recursive {@link Proxy} that returns a `[WIP: key.path]` placeholder for a
 * missing key instead of `undefined`, so an untranslated string shows up in the
 * UI as itself rather than as a crash.
 */
function createFluidProxy(target: Record<string, unknown>, key = ''): unknown {
  return new Proxy(target, {
    get(obj, prop: string) {
      if (typeof prop === 'symbol') return Reflect.get(obj, prop);
      if (prop in obj) {
        const value = obj[prop];
        return typeof value === 'object'
          ? createFluidProxy(value as Record<string, unknown>, key ? `${key}.${prop}` : prop)
          : value;
      }
      return `[WIP: ${key ? `${key}.` : ''}${prop}]`;
    },
  });
}

const translators: Record<Locale, DeepFluid<typeof en>> = {
  en: createFluidProxy(en) as DeepFluid<typeof en>,
  sv: createFluidProxy(sv) as DeepFluid<typeof en>,
};

export function translator(locale: Locale): DeepFluid<typeof en> { return translators[locale]; }
export type Translations = ReturnType<typeof translator>;
