import { AnyAction } from "redux";
import * as names from "./action-names";

/**
 * Editor-agnostic text selection. Based on VSCode and Ace editor APIs.
 */
export interface Selection {
  /**
   * Starting position of the selection: where the user clicked first.
   */
  anchor: Position;
  /**
   * Ending position of the selection: where the user dragged to. Can be before or after anchor.
   */
  active: Position;
}

/**
 * Editor-agnostic text position. Based on VSCode API.
 */
export interface Position {
  /**
   * Index of first line is 1, not 0.
   */
  line: number;
  /**
   * Index of first character is 0.
   */
  character: number;
}

export interface SetTextAction {
  type: typeof names.SET_TEXT;
  text: string;
}

export interface SetSelectionsAction {
  type: typeof names.SET_SELECTIONS;
  selections: Selection[];
}

export type ActionTypes = SetTextAction | SetSelectionsAction;

export function isActionOfInterest(action: AnyAction): action is ActionTypes {
  return (action as ActionTypes).type !== undefined;
}
