# React Transition

Library that helps you create smooth css transitions in your react app.

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

```tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Transition } from "react-transition";

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

**Props**

### TransitionGroup

This is a container that wraps your `<Transition>` components and enter/leave transition on added/removed elements form the list.

**Props**

- `moveClass`: class that would be added to children that are `moved` due to element addition/removal.

- `name`: name for your child transitions, also used to generate moveClass if it's not provided.

- `appear`: if true performs appear transition for all of it's on initial render.

- `children`: Elements wrapped in `<Transition />` component.

<!-- ### Utils

This package is also exposes some of it's internal utils, so if you
need them in some cases you don't have to write them yourself

#### whenTransitionEnds

#### getTransitionInfo -->

## Differences from react-transition-group
