import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import * as React from "react";
import MonacoEditor from "react-monaco-editor";
import { connect } from "react-redux";
import { setSelections, setText } from "./actions";
import { State, store } from "./store";
import { Position, Selection } from "./types";

interface SelectionData {
  ranges: Range[];
  origin: string;
  update: (ranges: any[]) => void;
}

// export class Editor extends React.Component<EditorProps> {
//   render() {
//     return (
//       /**
//        * TODO(andrewhead): multi-select on option, not command.
//        */
//       <CodeMirror
//         // value={this.props.text}
//         value={this.props.text}
//         options={{
//           theme: "idea"
//         }}
//         onBeforeChange={(_, __, value) => {
//           store.dispatch(setText(value));
//         }}
//         /*
//         cursor={{
//           line: this.props.cursor !== null ? this.props.cursor.line : 0,
//           ch: this.props.cursor !== null ? this.props.cursor.character : 0
//         }}
//         onCursor={(_, pos: any) => {
//           console.log("cursor moved");
//           store.dispatch(setCursor({ line: pos.line, character: pos.ch }));
//         }}
//         */
//         selection={{
//           ranges: this.props.selections.map(selection => {
//             return {
//               anchor: { line: selection.anchor.line, ch: selection.anchor.character },
//               head: { line: selection.active.line, ch: selection.active.character }
//             };
//           }),
//           focus: true
//         }}
//         /*
//         selection={{
//           ranges: [
//             {
//               anchor: { ch: 5, line: 0 },
//               head: { ch: 20, line: 0 }
//             }
//           ]
//         }}
//         */
//         onSelection={(editor: CodeMirror.Editor, selections: SelectionData) => {
//           console.log("selection changed", selections);
//           store.dispatch(
//             setSelections(
//               ...selections.ranges.map(range => {
//                 return {
//                   anchor: { line: range.anchor.line, character: range.anchor.ch },
//                   active: { line: range.head.line, character: range.head.ch }
//                 };
//               })
//             )
//           );
//           if (selections.origin === undefined) {
//             selections.update(editor.getDoc().listSelections());
//           }
//         }}
//       />
//     );
//   }
// }

function getSelectionFromMonacoSelection(monacoSelection: monacoEditor.Selection): Selection {
  const start = { line: monacoSelection.startLineNumber, character: monacoSelection.startColumn };
  const end = { line: monacoSelection.endLineNumber, character: monacoSelection.endColumn };
  return monacoSelection.getDirection() === monacoEditor.SelectionDirection.LTR
    ? { anchor: start, active: end }
    : { anchor: end, active: start };
}

function getMonacoSelectionFromSelection(selection: Selection): monacoEditor.Selection {
  return new monacoEditor.Selection(
    selection.anchor.line,
    selection.anchor.character,
    selection.active.line,
    selection.active.character
  );
}

/**
 * From https://codesandbox.io/s/883y2zmp6l and GitHub discussion about Monaco,
 * https://github.com/react-monaco-editor/react-monaco-editor/issues/194,
 * implicitly under MIT license https://codesandbox.io/legal/terms.
 */
export class Editor extends React.Component<EditorProps> {
  private editor: monacoEditor.editor.IStandaloneCodeEditor | null = null;
  private monaco: typeof monacoEditor | null = null;

  constructor(props: EditorProps) {
    super(props);
    this.editorDidMount = this.editorDidMount.bind(this);
    this.updateEditor = this.updateEditor.bind(this);
  }

  editorDidMount(editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) {
    this.editor = editor;
    this.monaco = monaco;
    this.updateEditor();

    this.editor.onDidChangeCursorSelection(e => {
      store.dispatch(
        setSelections(
          ...[e.selection, ...e.secondarySelections].map(getSelectionFromMonacoSelection)
        )
      );
      // if (this.props.onSelectionsChange) {
      //   this.props.onSelectionsChange([e.selection, ...e.secondarySelections]);
      // }
      // this.updateEditor();
    });
  }

  componentDidUpdate() {
    this.updateEditor();
  }

  updateEditor() {
    if (this.editor === null) {
      return null;
    }
    if (this.props.text !== this.editor.getValue()) {
      this.editor.setValue(this.props.text);
      // this.editor.getLayoutInfo().contentHeight = this.props.text.split("\n").length * 19;
      // const contentHeight = this.editor.getModel()?.getLineCount() * 19 ; // 19 is the line height of default theme
    }

    const monacoSelections = this.props.selections.map(getMonacoSelectionFromSelection);
    const editorSelections = this.editor.getSelections();
    if (this.monaco !== null) {
      // TODO(andrewhead): Clear selections when set to 0.
      if (Array.isArray(this.props.selections) && this.props.selections.length > 0) {
        if (
          editorSelections === null ||
          !this.monaco.Selection.selectionsArrEqual(monacoSelections, editorSelections)
        ) {
          this.editor.setSelections(monacoSelections);
        }
      }
    }
  }

  render() {
    return (
      <div className="WebpageEditor">
        <MonacoEditor
          height="600px"
          theme="vs"
          editorDidMount={this.editorDidMount}
          onChange={value => {
            store.dispatch(setText(value));
            // this.updateEditor();
          }}
        />
      </div>
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
