import { AnyAction } from "redux";
import * as names from "./action-names";
import { isActionOfInterest, Position, Selection } from "./types";

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

export function cursorReducer(state: Position | null = null, action: AnyAction): Position | null {
  if (isActionOfInterest(action)) {
    switch (action.type) {
      case names.SET_CURSOR:
        return action.position;
      default:
        return state;
    }
  }
  return state;
}
