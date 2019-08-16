import * as names from "./action-names";
import { Position, Selection } from "./types";

export function setText(newText: string) {
  return {
    text: newText,
    type: names.SET_TEXT
  };
}

export function setSelections(...selections: Selection[]) {
  return {
    selections,
    type: names.SET_SELECTIONS
  };
}

export function setCursor(position: Position) {
  return {
    position,
    type: names.SET_CURSOR
  };
}
