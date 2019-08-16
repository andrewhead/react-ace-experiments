import { AnyAction } from "redux";
import * as names from "./action-names";
import { isActionOfInterest, Selection } from "./types";

export function textReducer(state = "", action: AnyAction) {
  if (isActionOfInterest(action)) {
    switch (action.type) {
      case names.SET_TEXT:
        return action.text;
      default:
        return state;
    }
  }
  return state;
}

const initialSelections: Selection[] = [];

export function selectionsReducer(state = initialSelections, action: AnyAction) {
  if (isActionOfInterest(action)) {
    switch (action.type) {
      case names.SET_SELECTIONS:
        return action.selections;
      default:
        return state;
    }
  }
  return state;
}
