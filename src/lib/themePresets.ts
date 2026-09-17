import { DualListBoxTheme } from './types';

/** Bootstrap 5.2 theme; also the built-in default used when no theme is supplied. */
export const defaultTheme: DualListBoxTheme = {
  container: 'dual-listbox',
  row: 'row mb-3',
  colLeft: 'col-md-5',
  colCenter: 'col-md-2 d-flex justify-content-center flex-column gap-3',
  colRight: 'col-md-5',
  card: 'card h-100',
  cardHeader: 'card-header',
  cardBody: 'card-body',
  cardFooter: 'card-footer text-center',
  searchInput: 'form-control mb-3 dual-listbox-search',
  listGroup: 'list-group',
  listItem: 'list-group-item py-1 border-0',
  formCheck: 'form-check',
  formCheckInput: 'form-check-input',
  formCheckLabel: 'form-check-label',
  btn: 'btn btn-light w-100',
  btnInclude: '',
  btnExclude: '',
};

/** Alias of {@link defaultTheme}, kept as an explicit named export for clarity at call sites. */
export const bootstrapTheme: DualListBoxTheme = { ...defaultTheme };

/** Tailwind CSS theme, with `dark:` variants for dark mode. */
export const tailwindTheme: DualListBoxTheme = {
  container: 'dual-listbox',
  row: 'grid grid-cols-1 gap-3 md:grid-cols-5',
  colLeft: 'md:col-span-2',
  colCenter: 'flex flex-col justify-center gap-2 md:col-span-1',
  colRight: 'md:col-span-2',
  card: 'flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800',
  cardHeader: 'border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200',
  cardBody: 'flex-1 p-3',
  cardFooter: 'border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400',
  searchInput: 'dual-listbox-search mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white',
  listGroup: 'space-y-1',
  listItem: 'rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700',
  formCheck: 'flex items-center gap-2',
  formCheckInput: 'h-4 w-4 rounded text-primary-600 focus:ring-primary-500',
  formCheckLabel: '',
  btn: 'btn-outline w-full',
  btnInclude: 'mb-2',
  btnExclude: '',
};
