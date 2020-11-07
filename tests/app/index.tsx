import React, { useReducer } from "react";
import ReactDOM from "react-dom";
import Transition, { TransitionProps } from "Transition";

const defaultProps = Object.freeze({
  visible: false,
  name: "test" as const,
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
      <Transition {...props}>
        <div
          id="transition-element"
          style={{ width: 200, height: 200, background: "black" }}
        ></div>
      </Transition>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
