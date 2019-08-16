import ace, { Position as AcePosition, Range as AceRange } from "brace";
import _ from "lodash";
import * as React from "react";
import AceEditor from "react-ace";
import { connect } from "react-redux";
import { setSelections, setText } from "./actions";
import { State, store } from "./store";
import { Selection } from "./types";

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
interface MultiSelectSelection {
  inMultiSelectMode: boolean;
  getSelectionAnchor(): AcePosition;
  getSelectionLead(): AcePosition;
  getAllRanges(): MultiSelectRange[];
  fromOrientedRange(range: MultiSelectRange): void;
  addRange(range: AceRange, $blockChangeEvents: boolean): void;
}

interface MultiSelectRange extends AceRange {
  cursor: AcePosition;
}

export class Editor extends React.Component<EditorProps> {
  onSelectionChange(selection: MultiSelectSelection) {
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
      const aceAnchor = selection.getSelectionAnchor();
      const aceLead = selection.getSelectionLead();
      selections.push({
        active: { line: aceLead.row + 1, character: aceLead.column },
        anchor: { line: aceAnchor.row + 1, character: aceAnchor.column }
      });
    }
    // console.log("New selections", selections);
    store.dispatch(setSelections(...selections));
  }

  componentDidUpdate(prevProps: EditorProps) {
    if (!_.isEqual(this.props.selections, prevProps.selections)) {
      const editor = (this.refs.ace as AceEditor).editor;
      const aceSelection = editor.session.selection as MultiSelectSelection;
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
          aceSelection.addRange(range, true);
        }
      }
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
        onCursorChange={this.onSelectionChange.bind(this)}
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
}

export default connect((state: State) => {
  return { text: state.text, selections: state.selections };
})(Editor);
