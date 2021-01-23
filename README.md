# React Transition

Library that helps you create smooth css transitions in your react app.

### `Note that this documentation is still work in progress`

## Why?

I decided to create this package because often used `react-transition-group`
but I didn't like some things about it. For instance you have to pass `timeout`
or provide your custom `addEndListener`. Also you don't have a "move" transition
for `<TransitionGroup />`. More on the differences you can read in this section.

## Install

Using npm:

Right now this library is published as `@ayub-begimkulov/react-transition`. I used this name to publish the first version, but I'm still not sure how to name it (so if you how any ideas feel free to open an issue).

```bash
npm i @ayub-begimkulov/react-transition
```

Or yarn:

```bash
yarn add @ayub-begimkulov/react-transition
```

Note that this library uses hooks, so you need to have `react` and `react-dom` 16.8.0 or higher.

## Usage

### CSS Transition

```jsx
import React, { useState } from "react";
import { Transition } from "@ayub-begimkulov/react-transition";

import "./index.scss";

const App = () => {
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
```

```scss
.fade {
  &-leave-to,
  &-enter-from {
    opacity: 0;
    transform: translateX(300px);
  }

  &-enter-active,
  &-leave-active {
    transition: all 500ms ease;
  }

  &-leave-from,
  &-enter-to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### CSS Animation

```jsx
import React, { useState } from "react";
import { Transition } from "@ayub-begimkulov/react-transition";

import "./index.scss";

const App = () => {
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
```

```scss
.fade-animation {
  &-enter-active {
    animation: rotate-in 500ms ease;
  }

  &-leave-active {
    animation: rotate-in 500ms ease reverse;
  }

  &-move {
    transition: transform 500ms ease;
  }
}

@keyframes rotate-in {
  0% {
    transform: scale(0) rotate(360deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
```

### TransitionGroup Move

```jsx
import React from "react";
import { Transition, TransitionGroup } from "@ayub-begimkulov/react-transition";
import { shuffle } from "lodash-es";

const makeArr = () => {
  return Array(81)
    .fill(null)
    .map((_, index) => ({
      id: "$" + index,
      number: (index % 9) + 1,
    }));
};

const App = () => {
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
```

```scss
.container {
  display: flex;
  flex-wrap: wrap;
  width: 240px;
  margin-top: 10px;
}

.cell {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 25px;
  height: 25px;
  border: 1px solid #aaa;
  margin-right: -1px;
  margin-bottom: -1px;
}

.cell:nth-child(3n) {
  margin-right: 0;
}

.cell:nth-child(27n) {
  margin-bottom: 0;
}

.cell-move {
  transition: transform 2s;
}
```

### TransitionGroup Enter, Leave and Move

```jsx
import React from "react";
import { Transition, TransitionGroup } from "@ayub-begimkulov/react-transition";
import { shuffle } from "lodash-es";

const getRandomIndex = (length: number) => Math.floor(Math.random() * length);

const initialNumbers = new Array(10)
  .fill(null)
  .map((_, i) => ({ value: i, index: Math.random() }));

const App = () => {
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
```

```scss
.fade {
  &-leave-to,
  &-enter-from {
    transform: translateX(200px);
    opacity: 0;
  }

  &-enter-active,
  &-leave-active {
    transition: opacity 500ms ease, transform 500ms ease;
  }

  &-leave-from,
  &-enter-to {
    transform: translateX(0);
    opacity: 1;
  }

  &-move {
    transition: transform 500ms ease;
  }
}
```

## API

### Transition

#### Props

<!-- prettier-ignore -->
| name  | type | default | description|
| --- | --- | --- | --- | 
| visible           | `boolean`                 | `false`                       | Determents wether to show component or nor, trigger transition on change |
| name              | `string`                  | `transition`                  | The name of the transition, used to generate a default transition classes |
| appear            | `boolean`                 | `false`                       | DBy default enter transition is not performed on initial render, if you want this behavior set `appear` and `visible` to `true` |
| nodeRef           | `React.MutableRef<Element \| null> \| ((node: Element) => void` | `undefined` | `<Transition />` component passes `ref` to it's children. So if you also want to use `ref` pass it to the wrapping `<Transition />` component |
| unmount           | `boolean`                 | `true`                        | By default the child is unmounted on exit. If you prefer no unmounting (hided with `display: none`) change this to `false`. |
| type              | `'animation' \| 'transition' \| undefined` | `undefined` | TODO |
| enterFromClass    | `string`                  | `` `${name}-enter-from` ``    | Class that sets the starting styles of enter transition.                                                                                                   |
| enterActiveClass  | `string`                  | `` `${name}-enter-to` ``      | Class that sets the active style of enter transition. This class can be used to define the duration, delay and easing curve for the entering transition.   |
| enterToClass      | `string`                  | `` `${name}-enter-active` ``  | Class that sets the ending styles of enter transition.                                                                                                     |
| leaveFromClass    | `string`                  | `` `${name}-leave-from` ``    | Class that sets the starting styles of leave transition.                                                                                                   |
| leaveActiveClass  | `string`                  | `` `${name}-leave-active` ``  | Class that sets the active style of leave transition. This class can be used to define the duration, delay and easing curve for the leaving transition.    |
| leaveToClass      | `string`                  | `` `${name}-leave-to` ``      | Class that sets the ending styles of leave transition.                                                                                                     |
| appearFromClass   | `string`                  | `` `${name}-appear-from` ``   | Class that sets the starting styles of appear transition.                                                                                                  |             |
| appearActiveClass | `string`                  | `` `${name}-appear-active` `` | Class that sets the active style of appear transition. This class can be used to define the duration, delay and easing curve for the appearing transition. |
| appearToClass     | `string`                  | `` `${name}-appear-to` ``     | Class that sets the ending styles of appear transition.                                                                                                    |

### TransitionGroup

This is a container that wraps your `<Transition>` components and performs enter/leave transition on added/removed elements form the list.

#### Props

<!-- prettier-ignore -->
| name      | type                 | default              | description                                                                             |
| --------- | -------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| name      | `string`             | `transition`         | Name for your child transitions, also used to generate moveClass if it's not provided.  |
| moveClass | `string`             | `` `${name}-move` `` | Class that would be added to children that are `moved` due to element addition/removal. |
| appear    | `boolean`            | `false`              | if true performs appear transition for all of it's on initial render.                   |
| children  | `React.ReactElement` | -                    | Elements wrapped in `<Transition />` component. |

<!-- ### Utils

This package is also exposes some of it's internal utils, so if you
need them in some cases you don't have to write them yourself

#### whenTransitionEnds

#### getTransitionInfo -->

<!-- ## Differences from react-transition-group -->

```

```
