
export type DualListBoxItem = Record<string, any> & {
  [key: string]: any;
};

export type OnSubmitHandler = (
  selected: Record<string, DualListBoxItem[]>,
  unselected: Record<string, DualListBoxItem[]>,
  allItems: DualListBoxItem[],
  selectedArray: (string | number)[]
) => void;

export interface DualListBoxTheme {
  container: string;
  row: string;
  colLeft: string;
  colCenter: string;
  colRight: string;
  card: string;
  cardHeader: string;
  cardBody: string;
  cardFooter: string;
  searchInput: string;
  listGroup: string;
  listItem: string;
  formCheck: string;
  formCheckInput: string;
  formCheckLabel: string;
  btn: string;
  btnInclude: string;
  btnExclude: string;
}

export interface DualListBoxOptions {
  itemName?: string;
  groupName?: string;
  valueName?: string;
  inputName?: string;
  tabNameText?: string;
  rightTabNameText?: string;
  searchPlaceholderText?: string;
  includeButtonText?: string;
  excludeButtonText?: string;
  dataArray?: DualListBoxItem[];
  selectedItems?: DualListBoxItem[];
  hideEmptyGroups?: boolean;
  submitForm?: boolean;
  onSubmit?: OnSubmitHandler | null;
  theme?: Partial<DualListBoxTheme>;
}
