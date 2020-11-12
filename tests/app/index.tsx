import React, { useReducer } from "react";
import ReactDOM from "react-dom";
import Transition, { TransitionProps } from "Transition";

const defaultProps = Object.freeze({
  visible: false,
});

export const App = () => {
  const [props, setProps] = useReducer(
    (state: TransitionProps, newState: Partial<TransitionProps>) => ({
      ...state,
      ...newState,
    }),
    defaultProps
  );

  (window as any).setProps = setProps;

  return (
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
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
