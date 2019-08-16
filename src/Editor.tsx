import ace, { Position as AcePosition, Range as AceRange, Selection as AceSelection } from "brace";
import _ from "lodash";
import * as React from "react";
import AceEditor from "react-ace";
import { connect } from "react-redux";
import { setCursor, setSelections, setText } from "./actions";
import { State, store } from "./store";
import { Position, Selection } from "./types";

/*
 * Any Ace Editor primitives that must be used as functions or classes (rather than just types)
 * should be imported here.
 */
const { Range: AceRangeConstructor } = ace.acequire("ace/range");
const { Selection: AceSelectionConstructor } = ace.acequire("ace/selection");

function onChange(newValue: string, ev: any) {
  store.dispatch(setText(newValue));
}

/**
 * When multi-select is enabled in Ace, a selection has additional properties, and ranges have
 * a 'cursor' property that can be used to determine the direction of a selection.
 */
interface ExtendedSelection extends Omit<AceSelection, "addRange"> {
  inMultiSelectMode: boolean;
  getAllRanges(): MultiSelectRange[];
  /**
   * XXX(andrewhead): Not documented. Probably some way to achieve same functionality without
   * it, but it would end up being a lot more code or another hack. Main thing this gets us
   * is it lets us set whether a range is backwards or forwards.
   */
  fromJSON(json: AceSelectionJson): void;
  toJSON(): AceSelectionJson;
  addRange: (range: AceRange, $blockChangeEvents: boolean) => void;
}

type AceSelectionJson = AceRangeJson[];

interface AceRangeJson {
  start: AcePosition;
  end: AcePosition;
  isBackwards: boolean;
}

interface MultiSelectRange extends AceRange {
  cursor: AcePosition;
}

interface AceEvent {
  /**
   * Only the types handled in this tool are listed here.
   */
  type: "cursorChanged" | "selectionChanged";
}

export class Editor extends React.Component<EditorProps> {
  _handlingComponentUpdate: boolean = false;

  onCursorChange(selection: AceSelection) {
    if (this._handlingComponentUpdate) {
      return;
    }
    const acePosition = selection.getCursor();
    const position = { line: acePosition.row + 1, character: acePosition.column };
    store.dispatch(setCursor(position));
  }

  onSelectionChange(selection: ExtendedSelection, ev: any) {
    if (this._handlingComponentUpdate) {
      console.log("skippin for selection", JSON.stringify(selection, undefined, 2));
      return;
    }
    const selections = [];
    if (selection.inMultiSelectMode === true) {
      for (const range of selection.getAllRanges()) {
        const backwards =
          range.cursor.row === range.start.row && range.cursor.column === range.end.column;
        const startPos = { line: range.start.row + 1, character: range.start.column };
        const endPos = { line: range.end.row + 1, character: range.end.column };
        selections.push(
          backwards ? { anchor: endPos, active: startPos } : { anchor: startPos, active: endPos }
        );
      }
    } else if (selection.inMultiSelectMode === false || selection.inMultiSelectMode === undefined) {
      // console.log("not in multi-select");
      const aceAnchor = selection.getSelectionAnchor();
      const aceLead = selection.getSelectionLead();
      selections.push({
        active: { line: aceLead.row + 1, character: aceLead.column },
        anchor: { line: aceAnchor.row + 1, character: aceAnchor.column }
      });
      console.log("adding selections to state", JSON.stringify(selections, undefined, 2));
    }
    // console.log("New selections", selections);
    store.dispatch(setSelections(...selections));
  }

  componentDidUpdate(prevProps: EditorProps) {
    const editor = (this.refs.ace as AceEditor).editor;
    const aceSelection = editor.session.selection as ExtendedSelection;
    if (!_.isEqual(this.props.cursor, prevProps.cursor)) {
      // console.log("processing moving cursor");
      if (aceSelection.isEmpty() && this.props.cursor !== null) {
        /*
        aceSelection.moveCursorToPosition({
          row: this.props.cursor.line - 1,
          column: this.props.cursor.character
        });
        */
      }
    }
    if (!_.isEqual(this.props.selections, prevProps.selections)) {
      const rangeJson = this.props.selections.map(selection => {
        console.log("adding selection", JSON.stringify(selection, undefined, 2));
        return {
          start: { row: selection.anchor.line - 1, column: selection.anchor.character },
          end: { row: selection.active.line - 1, column: selection.active.character },
          isBackwards:
            selection.anchor.line === selection.active.line
              ? selection.anchor.character > selection.active.character
              : selection.anchor.line > selection.active.line
        };
      });
      console.log("new ranges", JSON.stringify(rangeJson, undefined, 2));
      if (!_.isEqual(aceSelection.toJSON(), rangeJson)) {
        this._handlingComponentUpdate = true;
        aceSelection.fromJSON(rangeJson);
        this._handlingComponentUpdate = false;
      }
      /*
      for (let i = 0; i < this.props.selections.length; i++) {
        const selection = this.props.selections[i];
        const range = new AceRangeConstructor(
          selection.anchor.line - 1,
          selection.anchor.character,
          selection.active.line - 1,
          selection.active.character
        );
        if (i === 0) {
          aceSelection.fromOrientedRange(range);
        } else {
          if (aceSelection.inMultiSelectMode === true) {
            aceSelection.addRange(range, true);
          }
        }
      }
      */
    }
  }

  /* TODO(andrewhead): set keybinding to opt+click for multiple selections (not ctrl+option+click) */
  /*
   * TODO(andrewhead): initialize with initial selections.
   */
  render() {
    return (
      <AceEditor
        ref="ace"
        value={this.props.text}
        onCursorChange={this.onCursorChange.bind(this)}
        markers={[]}
        onChange={onChange}
        maxLines={4}
        onSelectionChange={this.onSelectionChange.bind(this)}
        editorProps={{
          $enableMultiselect: true,
          $blockScrolling: Infinity
        }}
      />
    );
  }
}

interface EditorProps {
  text: string;
  selections: Selection[];
  cursor: Position | null;
}

export default connect((state: State) => {
  return { text: state.text, selections: state.selections, cursor: state.cursor };
})(Editor);
