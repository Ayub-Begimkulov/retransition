import React from "react";
import { useState } from "react";
import { Transition } from "..";
import "./style.css";

export default {
  title: "Components/Transition",
  component: Transition,
};

export const Default = () => {
  const [visible, setVisible] = useState(true);

  return (
    <>
      <button onClick={() => setVisible(v => !v)}>Toggle</button>
      <Transition visible={visible} name="fade">
        {({ ref }) => (
          <div
            ref={ref}
            style={{ height: 200, width: 200, background: "black" }}
          ></div>
        )}
      </Transition>
    </>
  );
};

export const CSSAnimation = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <button onClick={() => setVisible(v => !v)}>Toggle</button>
      <Transition visible={visible} name="fade-animation">
        {({ ref }) => (
          <div
            ref={ref}
            style={{ height: 200, width: 200, background: "black" }}
          ></div>
        )}
      </Transition>
    </>
  );
};

// TODO write a test case for this situation
export const DisplayNone = () => {
  const [visible, setVisible] = useState(true);

  return (
    <>
      <button onClick={() => setVisible(v => !v)}>Toggle</button>
      <Transition
        visible={visible}
        name="fade-animation"
        appear
        unmount={false}
      >
        {({ ref }) => (
          <div
            ref={ref}
            style={{
              height: 200,
              width: 200,
              background: "black",
              display: "flex",
            }}
          ></div>
        )}
      </Transition>
    </>
  );
};
