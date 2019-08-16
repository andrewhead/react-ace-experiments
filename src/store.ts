import { AnyAction, combineReducers, createStore as reduxCreateStore, Store } from "redux";
import { cursorReducer, selectionsReducer, textReducer } from "./reducers";

export const rootReducer = combineReducers({
  selections: selectionsReducer,
  cursor: cursorReducer,
  text: textReducer
});

export const createStore = (): Store<State, AnyAction> => {
  return reduxCreateStore(rootReducer, undefined);
};

export const store = createStore();

export type State = ReturnType<typeof rootReducer>;
