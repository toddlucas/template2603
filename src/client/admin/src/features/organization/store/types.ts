import type { OrganizationModel, OrganizationDetailModel } from '$/models/access';
import type {
  ItemTableState,
  ItemState,
  ItemActions,
  CrudActions,
  HierarchicalActions
} from '$/platform/store/types';

//------------------------------
// Organization-specific types
//------------------------------

export type OrganizationTableState = ItemTableState<number>;

export interface OrganizationState extends ItemState<OrganizationModel, number> {
  currentItem: OrganizationDetailModel | null;
}

export interface OrganizationActions extends
  ItemActions<OrganizationModel, number>,
  CrudActions<OrganizationModel, number>,
  HierarchicalActions<number> {
}

export type OrganizationStore = OrganizationState & OrganizationActions;
