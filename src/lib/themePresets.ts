import { DualListBoxTheme } from './types';

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

export const bootstrapTheme: DualListBoxTheme = { ...defaultTheme };

export const tailwindTheme: DualListBoxTheme = {
  container: 'dual-listbox tw',
  row: 'grid grid-cols-1 md:grid-cols-5 gap-3',
  colLeft: 'md:col-span-2',
  colCenter: 'md:col-span-1 flex flex-col justify-center gap-3',
  colRight: 'md:col-span-2',
  card: 'h-full border rounded shadow-sm bg-white',
  cardHeader: 'px-4 py-2 border-b font-medium',
  cardBody: 'p-4',
  cardFooter: 'px-4 py-2 border-t text-center',
  searchInput: 'w-full mb-3 border rounded px-3 py-2 dual-listbox-search',
  listGroup: 'space-y-1',
  listItem: 'py-1',
  formCheck: 'flex items-center gap-2',
  formCheckInput: 'h-4 w-4',
  formCheckLabel: '',
  btn: 'w-full border rounded px-3 py-2 bg-gray-100 hover:bg-gray-200',
  btnInclude: 'mb-2',
  btnExclude: '',
};
