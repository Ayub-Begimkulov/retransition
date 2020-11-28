import React, { useReducer, useState } from "react";
import ReactDOM from "react-dom";
import { Transition, TransitionProps } from "test-react-css-transition";

const defaultProps = Object.freeze({
  visible: false,
});

const w = window as any;

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

ReactDOM.render(<App />, document.getElementById("app"));
