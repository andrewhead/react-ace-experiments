import { Range } from "codemirror";
import * as React from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import { connect } from "react-redux";
import { setSelections, setText } from "./actions";
import { State, store } from "./store";
import { Position, Selection } from "./types";

require("codemirror/mode/xml/xml");
require("codemirror/mode/javascript/javascript");

interface SelectionData {
  ranges: Range[];
  origin: string;
  update: (ranges: any[]) => void;
}

export class Editor extends React.Component<EditorProps> {
  render() {
    return (
      /**
       * TODO(andrewhead): multi-select on option, not command.
       */
      <CodeMirror
        // value={this.props.text}
        value={this.props.text}
        options={{
          theme: "idea"
        }}
        onBeforeChange={(_, __, value) => {
          store.dispatch(setText(value));
        }}
        /*
        cursor={{
          line: this.props.cursor !== null ? this.props.cursor.line : 0,
          ch: this.props.cursor !== null ? this.props.cursor.character : 0
        }}
        onCursor={(_, pos: any) => {
          console.log("cursor moved");
          store.dispatch(setCursor({ line: pos.line, character: pos.ch }));
        }}
        */
        selection={{
          ranges: this.props.selections.map(selection => {
            return {
              anchor: { line: selection.anchor.line, ch: selection.anchor.character },
              head: { line: selection.active.line, ch: selection.active.character }
            };
          }),
          focus: true
        }}
        /*
        selection={{
          ranges: [
            {
              anchor: { ch: 5, line: 0 },
              head: { ch: 20, line: 0 }
            }
          ]
        }}
        */
        onSelection={(editor: CodeMirror.Editor, selections: SelectionData) => {
          console.log("selection changed", selections);
          store.dispatch(
            setSelections(
              ...selections.ranges.map(range => {
                return {
                  anchor: { line: range.anchor.line, character: range.anchor.ch },
                  active: { line: range.head.line, character: range.head.ch }
                };
              })
            )
          );
          if (selections.origin === undefined) {
            selections.update(editor.getDoc().listSelections());
          }
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
