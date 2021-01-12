import React from "react";
import ReactDOM from "react-dom";
import { Transition, TransitionGroup } from "../../src";

const w = window as any;

export const App = (props: any) => {
  return (
    <div id="container">
      <TransitionGroup>
        {props.elements.map((e: number) => (
          <div key={e}>{e}</div>
        ))}
      </TransitionGroup>
    </div>
  );
};

export const App2 = (props: any) => {
  return (
    <div id="container">
      <Transition {...props}>
        <div id="transition-element"></div>
      </Transition>
    </div>
  );
};

const baseElement = document.getElementById("app");

let latestProps: any;

w.render = (props: any, cb?: () => void) => {
  latestProps = { ...latestProps, ...props };
  ReactDOM.render(App2(latestProps), baseElement, cb);
};
