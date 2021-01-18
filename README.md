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

```bash
npm i react-transition
```

Or yarn:

```bash
yarn add react-transition
```

Note that this uses hooks, so you need to have `react` and `react-dom` 16.8.0 or higher.

## Usage

in your `index.js`:

```tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Transition } from "react-transition";

import "./index.scss";

const App = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <button onClick={() => setVisible(v => !v)}>Toggle</button>
      <Transition visible={visible} name="fade">
        <div style={{ height: 300, width: 300, background: "black" }}></div>
      </Transition>
    </>
  );
};
```

`index.scss`:

```scss
.fade {
  &-leave-to,
  &-enter-from {
    opacity: 0;
  }

  &-enter-active,
  &-leave-active {
    transition: opacity 500ms ease;
  }

  &-leave-from,
  &-enter-to {
    opacity: 1;
  }
}
```

## API

### Transition

#### Props

**visible**
Determents wether to show component or nor, trigger transition on change
type: `boolean`
default: `false`

**name**
The name of the transition, used to generate a default transition classes
type: `string`
default: `transition`

**appear**
By default enter transition is not performed on initial render, if you want this behavior set `appear` and `visible` to `true`;  
type: `string`
default: `transition`

**nodeRef**
`<Transition />` component passes `ref` to it's children. So if you also want to use `ref` pass it to the wrapping `<Transition />` component.
type: `React.MutableRef<Element | null> | ((node: Element) => void)`
default: `transition`

**unmount**
By default the child is unmounted on exit. If you prefer no unmounting (hided with `display: none`) change this to `false`.

type: `boolean`
default: `true`

**type**
TODO

type: `'animation' | 'transition' | undefined`
default: `undefined`

**enterFromClass**
Class that sets the starting styles of enter transition.

type: `string`
default: `` `${name}-enter-from` ``

**enterActiveClass**
Class that sets the active style of enter transition. This class can be used to define the duration, delay and easing curve for the entering transition.

type: `string`
default: `` `${name}-enter-to` ``

**enterToClass**
Class that sets the ending styles of enter transition.
type: `string`
default: `` `${name}-enter-active` ``

**leaveFromClass**
Class that sets the starting styles of leave transition.

type: `string`
default: `` `${name}-leave-from` ``

**leaveActiveClass**
Class that sets the active style of leave transition. This class can be used to define the duration, delay and easing curve for the leaving transition.

type: `string`
default: `` `${name}-leave-active` ``

**leaveToClass**
Class that sets the ending styles of leave transition.
type: `string`
default: `` `${name}-leave-to` ``

**appearFromClass**
Class that sets the starting styles of appear transition.
type: `string`
default: `` `${name}-appear-from` ``

**appearActiveClass**
Class that sets the active style of appear transition. This class can be used to define the duration, delay and easing curve for the appearing transition.

type: `string`
default: `` `${name}-appear-active` ``

**appearToClass**
Class that sets the ending styles of appear transition.
type: `string`
default: `` `${name}-appear-to` ``

### TransitionGroup

This is a container that wraps your `<Transition>` components and enter/leave transition on added/removed elements form the list.

#### Props

**name**
Name for your child transitions, also used to generate moveClass if it's not provided.

type: `string`
default: `transition`

**moveClass**
Class that would be added to children that are `moved` due to element addition/removal.

type: `string`
default: `` `${name}-move` ``

**appear**
if true performs appear transition for all of it's on initial render.

type: `boolean`
default: `false`

**children**
Elements wrapped in `<Transition />` component.

<!-- ### Utils

This package is also exposes some of it's internal utils, so if you
need them in some cases you don't have to write them yourself

#### whenTransitionEnds

#### getTransitionInfo -->

<!-- ## Differences from react-transition-group -->
