import React, { useState } from "react";
import { Transition, TransitionGroup } from "../src";

import "./index.scss";

let nextNum = 10;

const App = () => {
  const [visible, setVisible] = useState(true);
  const [arr, setArr] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const randomIndex = () => {
    return Math.floor(Math.random() * arr.length);
  };

  const add = () => {
    const idx = randomIndex();
    setArr(arr => [...arr.slice(0, idx), nextNum++, ...arr.slice(idx)]);
  };

  const remove = () => {
    const idx = randomIndex();
    setArr(arr => [...arr.slice(0, idx), ...arr.slice(idx + 1)]);
  };

  return (
    <>
      <div style={{ height: 300 }}>
        <button
          onClick={() => setVisible(v => !v)}
          style={{ marginBottom: 20 }}
        >
          Toggle
        </button>
        <Transition visible={visible} name="fade" appear>
          <div style={{ width: 200, height: 200, background: "black" }}>
            Hello world
          </div>
        </Transition>
      </div>
      <div>
        <button onClick={() => add()}>Add</button>
        <button onClick={() => remove()}>Remove</button>
        <TransitionGroup>
          {arr.map(value => (
            <div key={value}>{value}</div>
          ))}
        </TransitionGroup>
      </div>
    </>
  );
};

export default App;
