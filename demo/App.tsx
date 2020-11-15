import React, { useState } from "react";
import { Transition, TransitionGroup } from "../src";

import "./index.scss";

let nextNum = 10;

function shuffle(array: any[]) {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  const result = array.slice();
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  return result;
}

const App = () => {
  const [visible, setVisible] = useState(true);

  console.log("app render");

  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: 1 }}>
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
        {false && (
          <>
            <Sudoku />
          </>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <RandomNumbers />
      </div>
    </div>
  );
};

const RandomNumbers = () => {
  const [arr, setArr] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const randomIndex = () => {
    return Math.floor(Math.random() * arr.length);
  };

  const add = () => {
    const idx = randomIndex();
    setArr(arr => [...arr.slice(0, idx), nextNum++, ...arr.slice(idx)]);
  };

  const remove = (idx = randomIndex()) => {
    setArr(arr => [...arr.slice(0, idx), ...arr.slice(idx + 1)]);
  };

  const removeFirst = () => {
    remove(0);
  };

  const removeLast = () => {
    remove(arr.length - 1);
  };

  return (
    <div>
      <button onClick={() => add()}>Add</button>
      <button onClick={() => remove()}>Remove Random</button>
      <button onClick={() => removeFirst()}>Remove First</button>
      <button onClick={() => removeLast()}>Remove Last</button>
      <TransitionGroup name="test" appear>
        {arr.map(value => (
          <div key={"$" + value}>{value}</div>
        ))}
      </TransitionGroup>
    </div>
  );
};

const makeArr = () => {
  return Array(81)
    .fill(null)
    .map((_, index) => ({
      id: "$" + index,
      number: (index % 9) + 1,
    }));
};

const Sudoku = () => {
  const [numbers, setNumbers] = useState(() => makeArr());

  return (
    <>
      <button onClick={() => setNumbers(v => shuffle(v))}>shuffle</button>{" "}
      <TransitionGroup className="container" name="cell">
        {numbers.map(({ id, number }) => (
          <div key={id} className="cell">
            {number}
          </div>
        ))}
      </TransitionGroup>
    </>
  );
};

export default App;
