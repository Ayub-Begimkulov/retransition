import React, { useState } from "react";
import Transition from "Transition";
import "./index.scss";
const App = () => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <button onClick={() => setVisible(v => !v)} style={{ marginBottom: 40 }}>
        Toggle
      </button>
      <Transition visible={visible} name="greeting">
        <div className="greeting">Hello world</div>
      </Transition>
    </>
  );
};

export default App;
