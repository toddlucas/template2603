import type { IdentityUserModel } from '$/models/identity-user-model';
import type {
  ItemTableState,
  ItemState,
  ItemActions
} from '$/platform/store/types';

//------------------------------
// User-specific types
//------------------------------

export type UserTableState = ItemTableState<string>;

export type UserState = ItemState<IdentityUserModel<string>, string>;

export type UserActions = ItemActions<IdentityUserModel<string>, string>;

export type UserStore = UserState & UserActions;
