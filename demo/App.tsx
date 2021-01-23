import React, { useState } from "react";
import { Transition, TransitionGroup } from "../src";

import "./index.scss";

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
  return (
    <div>
      <div style={{ height: 300 }}>
        <h2>CSS transition</h2>
        <Basic />
      </div>
      <div style={{ height: 300 }}>
        <h2>CSS animation</h2>
        <BasicAnimation />
      </div>
      <div>
        <h2>Transition Group Move</h2>
        <Sudoku />
      </div>
      <h2>TransitionGroup (move, add, remove)</h2>
      <NumbersList />
    </div>
  );
};

const Basic = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <button onClick={() => setVisible(v => !v)}>Toggle</button>
      <Transition visible={visible} name="fade">
        <div style={{ height: 200, width: 200, background: "black" }}></div>
      </Transition>
    </>
  );
};

const BasicAnimation = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <button onClick={() => setVisible(v => !v)}>Toggle</button>
      <Transition visible={visible} name="fade-animation">
        <div style={{ height: 200, width: 200, background: "black" }}></div>
      </Transition>
    </>
  );
};

const getRandomIndex = (length: number) => Math.floor(Math.random() * length);

const initialNumbers = new Array(10)
  .fill(null)
  .map((_, i) => ({ value: i, index: Math.random() }));

const NumbersList = () => {
  const [numbers, setNumbers] = useState(initialNumbers);

  const add = () => {
    const index = getRandomIndex(numbers.length);
    const newNum = {
      value: numbers.length,
      index: Math.random(),
    };
    const newValue = [
      ...numbers.slice(0, index),
      newNum,
      ...numbers.slice(index),
    ];
    setNumbers(newValue);
  };

  const remove = () => {
    const index = getRandomIndex(numbers.length);
    const newValue = numbers.filter((_, idx) => idx !== index);
    setNumbers(newValue);
  };

  const reorder = () => {
    setNumbers(n => shuffle(n));
  };

  return (
    <>
      <button onClick={add} style={{ marginRight: 5 }}>
        Add
      </button>
      <button onClick={remove} style={{ marginRight: 5 }}>
        Remove
      </button>
      <button onClick={reorder} style={{ marginRight: 5 }}>
        Shuffle
      </button>
      <div>
        <TransitionGroup name="fade">
          {numbers.map(n => (
            <Transition key={n.index}>
              <div style={{ padding: 5 }}>{n.value}</div>
            </Transition>
          ))}
        </TransitionGroup>
      </div>
    </>
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
      <div className="container">
        <TransitionGroup name="cell">
          {numbers.map(({ id, number }) => (
            <Transition key={id}>
              <div className="cell">{number}</div>
            </Transition>
          ))}
        </TransitionGroup>
      </div>
    </>
  );
};

export default App;
