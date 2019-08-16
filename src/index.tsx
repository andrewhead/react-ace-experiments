import * as React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import Editor from "./Editor";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import { store } from "./store";

/* TODO(andrewhead): test out undo'ing */

ReactDOM.render(
  <Provider store={store}>
    <p />
    <Editor />
    <p />
    <Editor />
    <p />
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
