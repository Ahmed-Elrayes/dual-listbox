import type {DualListBoxTheme} from './types';
import {defaultTheme} from './themePresets';

/**
 * Shallow-merges a theme override onto a base theme.
 *
 * @param base Theme to start from.
 * @param override Partial set of class-name overrides.
 * @returns A complete {@link DualListBoxTheme}.
 */
export function mergeTheme(base: DualListBoxTheme, override?: Partial<DualListBoxTheme>): DualListBoxTheme {
    return {...base, ...(override || {})} as DualListBoxTheme;
}

// SHARED MEMORY: module-level singleton, not per-instance state. Every
// `new DualListBox()` built after a `useTheme()` call reads this same value,
// which is what lets one call theme every list box on a page. It only
// affects instances constructed afterwards — already-rendered instances keep
// their frozen `settings.theme`. If this package is ever bundled as two
// separate module copies (e.g. two independently-chunked entry points), each
// copy owns its own `GLOBAL_THEME` and a `useTheme()` call in one is
// invisible to the other. Per-instance `options.theme` always wins over this
// regardless.
let GLOBAL_THEME: DualListBoxTheme = {...defaultTheme};

/**
 * Sets the global default theme used by every `DualListBox` constructed
 * afterwards. Per-instance `options.theme` always takes priority over this.
 *
 * @param theme A full theme or a partial set of overrides merged onto {@link defaultTheme}.
 */
export function useTheme(theme: Partial<DualListBoxTheme> | DualListBoxTheme) {
    GLOBAL_THEME = mergeTheme(defaultTheme, theme as Partial<DualListBoxTheme>);
}

/** @returns The current shared/global theme set via {@link useTheme}. */
export function getGlobalTheme(): DualListBoxTheme {
    return GLOBAL_THEME;
}
