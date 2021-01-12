import React from "react";
import ReactDOM from "react-dom";
import { Transition, TransitionGroup } from "../../src";

const w = window as any;

export const App = (props: any) => {
  const { elements, transitionProps, ...rest } = props;
  return (
    <div id="container">
      <TransitionGroup {...rest}>
        {elements.map((e: number) => (
          <Transition key={"$" + e} {...transitionProps}>
            <div>{e}</div>
          </Transition>
        ))}
      </TransitionGroup>
    </div>
  );
};

const baseElement = document.getElementById("app");

let latestProps: any;

w.render = (props: any, cb?: () => void) => {
  latestProps = { ...latestProps, ...props };
  ReactDOM.render(App(latestProps), baseElement, cb);
};
