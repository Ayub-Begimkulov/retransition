import React, { useReducer, useState } from "react";
import ReactDOM from "react-dom";
import { Transition, TransitionProps } from "../../src";
// import * as TestingLibrary from "@testing-library/dom";

const defaultProps = Object.freeze({
  visible: false,
});

const w = window as any;
// w.TestingLibrary = TestingLibrary;

export const App = () => {
  const [mounted, setMounted] = useState(false);
  const [props, setProps] = useReducer(
    (
      state: Omit<TransitionProps, "children">,
      newState: Partial<TransitionProps>
    ) => ({
      ...state,
      ...newState,
    }),
    defaultProps
  );

  w.mount = (...args: Parameters<typeof setProps>) => {
    setMounted(true);
    setProps(...args);
  };
  w.setProps = setProps;

  return mounted ? (
    <>
      <button
        id="btn"
        onClick={() => setProps({ visible: !props.visible })}
        style={{ marginBottom: 20 }}
      >
        Toggle
      </button>
      <div id="container">
        <Transition {...props}>
          <div id="transition-element"></div>
        </Transition>
      </div>
    </>
  ) : null;
};

export const App2 = (props: any) => {
  console.log("render with props");
  return (
    <div id="container">
      <Transition {...props}>
        <div id="transition-element"></div>
      </Transition>
    </div>
  );
};

const baseElement = document.getElementById("app");

// const render = (w.render = (
//   ui: (props: any) => React.ReactElement,
//   props: any
// ) => {
//   let latestProps = { ...props };
//   console.log("here");
//   ReactDOM.render(ui(props), baseElement);
//   console.log("return");
//   return (newProps: any) => {
//     latestProps = { ...latestProps, ...newProps };
//     ReactDOM.render(ui(latestProps), baseElement);
//   };
// });

ReactDOM.render(<App />, baseElement);

// w.render = (
//   // ui: (props: any) => React.ReactElement,
//   props: any = defaultProps,
//   cb?: () => void
// ) => {
//   let latestProps = { ...props };
//   ReactDOM.render(App2(props), baseElement, cb);
//   w.rerender = (newProps: any) => {
//     latestProps = { ...latestProps, ...newProps };
//     ReactDOM.render(App2(latestProps), baseElement);
//   };
// };

// render(App2, defaultProps);
