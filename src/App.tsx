import React, { useState } from "react";
import Transition from "Transition";
import TransitionGroup from "TransitionGroup";

import "./index.scss";

/* function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
} */

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
      <div style={{ height: 100 }}>
        <button
          onClick={() => setVisible(v => !v)}
          style={{ marginBottom: 40 }}
        >
          Toggle
        </button>
        <Transition visible={visible} name="greeting" appear>
          <div className="greeting">Hello world</div>
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
