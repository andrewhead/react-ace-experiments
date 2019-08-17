import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api";
import * as React from "react";
import MonacoEditor from "react-monaco-editor";
import { connect } from "react-redux";
import { setSelections, setText } from "./actions";
import { State, store } from "./store";
import { Selection } from "./types";

function getSelectionFromMonacoSelection(monacoSelection: monacoEditor.Selection): Selection {
  const start = { line: monacoSelection.startLineNumber, character: monacoSelection.startColumn };
  const end = { line: monacoSelection.endLineNumber, character: monacoSelection.endColumn };
  const selection =
    monacoSelection.getDirection() === monacoEditor.SelectionDirection.LTR
      ? { anchor: start, active: end }
      : { anchor: end, active: start };
  // Prototoype: constrain selections to single lines.
  if (selection.active.line > selection.anchor.line) {
    selection.active.line = selection.anchor.line;
    selection.active.character = Number.POSITIVE_INFINITY;
  } else if (selection.active.line < selection.anchor.line) {
    selection.active.line = selection.anchor.line;
    selection.active.character = 0;
  }
  return selection;
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
    }

    const monacoSelections = this.props.selections.map(getMonacoSelectionFromSelection);
    const editorSelections = this.editor.getSelections();
    if (this.monaco !== null) {
      /*
       * TODO(andrewhead): Clear selections when set to 0 (only seems to be the case when
       * the editors are initialized).
       */
      if (Array.isArray(this.props.selections) && this.props.selections.length > 0) {
        if (
          editorSelections === null ||
          !this.monaco.Selection.selectionsArrEqual(monacoSelections, editorSelections)
        ) {
          this.editor.setSelections(monacoSelections);
        }
      }
    }

    const lineHeight = this.editor.getConfiguration().lineHeight;
    const editorDomNode = this.editor.getDomNode();
    if (editorDomNode !== null) {
      editorDomNode.style.height = `${lineHeight * this.props.text.split("\n").length +
        this.editor.getConfiguration().layoutInfo.horizontalScrollbarHeight}px`;
      this.editor.layout();
    }
  }

  render() {
    return (
      <div className="WebpageEditor">
        <MonacoEditor
          theme="vs"
          editorDidMount={this.editorDidMount}
          onChange={value => {
            store.dispatch(setText(value));
          }}
          options={{
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            overviewRulerLanes: 0
            // readOnly: true
          }}
        />
      </div>
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
