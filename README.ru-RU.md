# React Transition

[![GitHub](https://img.shields.io/github/license/Ayub-Begimkulov/retransition)](https://github.com/Ayub-Begimkulov/retransition/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/retransition)](https://www.npmjs.com/package/retransition)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/retransition)](https://bundlephobia.com/result?p=retransition)

Библиотека которая помогает создавать плавные анимации ваших React компонентов.

<!-- The library that helps you create smooth CSS transitions in your react app. -->

| [English](README.md) | Russian |

## Преимущества

- Автоматическое определение завершения анимации
- Анимация списков по FLIP технике
- Совместимость с React Strict Mode
- Маленький размер (<2.8kb minified gzipped)
- Поддержка TypeScript'а из коробки

## Мотивация

Я часто пользовался библиотекой `react-transition-group`, но у нее есть такие недочеты, как обязательное условие прописывать duration в CSS, передача `timeout` или `addEndListener`. Также отсутствуют "move" анимации и совместимость с React Strict Mode. В связи с этим я решил создать свою библиотеку, предусмотрев в ней все вышеописанные минусы.

## Установка

На данный момент этот пакет опубликован как `retransition`. Я воспользовался этим именем так как пока не знаю как назвать эту библиотеку (если есть какие-то идеи, можно открыть issue).

npm:

```bash
npm i retransition
```

yarn:

```bash
yarn add retransition
```

Также стоит отметить что данная библиотека использует хуки, так что версия `react` и `react-dom` должна быть 16.8.0 или выше.

## Введение

### Простой пример

[Попробовать в codesandbox](https://codesandbox.io/s/css-transiton-basic-example-928fh?file=/src/App.js)

```jsx
import React, { useState } from "react";
import { Transition } from "retransition";

import "./index.css";

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

```css
.fade-leave-to,
.fade-enter-from {
  opacity: 0;
  transform: translateX(300px);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 500ms ease;
}

.fade-leave-from,
.fade-enter-to {
  opacity: 1;
  transform: translateX(0);
}
```

<!-- TODO update english version -->

Давайте рассмотрим данный пример по подробнее и посмотрим что происходит "под капотом".

Компонент `<Transition>` скрывает и показывает дочерний элемент на основе props'а `visible`. Однако это не произойдет мгновенно. Каждое появление и исчезновение будет происходит в 3 шага:

1. На первом шаге элемент будет добавлен в DOM, если у нас происходит появление. Будут добавлены классы `fade-(enter|leave)-from` и `fade-(enter|leave)-active`.

2. Когда браузер успеет обновить экран, будет удален класс `fade-(enter|leave)-from` и добавлен `fade-(enter|leave)-to`. Если стили для классов корректно прописаны, то у нас сработает анимация.

3. Когда анимация окончиться, мы удалим классы `fade-(enter|leave)-active` и `fade-(enter|leave)-to`. Если у нас происходила анимация исчезновения, то элемент будет удален из DOM.

### CSS Анимация

<!-- TODO english verion -->

Несмотря на то что CSS транзишены проще и чаще используются, есть некоторые ситуации когда они не дают нам достаточно контроля. Поэтому данная библиотека позволяет так же работать с CSS анимациями.

[Попробовать в codesandbox](https://codesandbox.io/s/css-animation-example-nroet?file=/src/App.js)

```jsx
import React, { useState } from "react";
import { Transition } from "retransition";

import "./index.css";

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

```css
.fade-animation-enter-active {
  animation: rotate-in 500ms ease;
}

.fade-animation-leave-active {
  animation: rotate-in 500ms ease reverse;
}

@keyframes rotate-in {
  0% {
    transform: scale(0) rotate(360deg);
  }
  70% {
    transform: scale(1.3) rotate(-108deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
```

### Тип анимации

Иногда вы можете иметь CSS `transition` и `animation` на одном и том же элементе. Для того, чтобы определить завершение анимации, эта библиотека воспользуется тем типом, который имеет более длительную продолжительность. Однако это не всегда может быть тем что вы хотите. Например, у вас может быть `animation` для первоначальной отрисовки (об этом мы поговорим чуть позже) и `transition` при наведении мышкой. В таком случае вам придется передать, какой тип должен использовать компонент `<Transition>`.

```jsx
<Transition type="animation" {...props}>
  {/* ... */}
</Transition>
```

### Демонтирование элемента

По дефолту, дочерний элемент будет демонтирован при исчезновении. Но если вы хотите, чтобы он был скрыт с помощью `display: none`, можно передать проп `unmount={false}`.

```jsx
<Transition name="fade" visible={visible} unmount={false}>
  <div>I'm always in the DOM</div>
</Transition>
```

### Анимация при первом рендере

Так же по дефолту анимация не сработает при первоначальном рендере. Если вы хотите поменять это - передайте проп `appear`.

```jsx
<Transition name="fade" visible={visible} appear>
  {/* ... */}
</Transition>
```

> Обратите внимание что можно просто передать `appear` без какого либо значения, это будет эквивалентно `appear={true}`.

Анимация будет идентичной с той что вы используете для появления. Однако если вам нужно чтобы первый рендер анимировался по другому (были другие классы и ивенты), вы можете передать `customAppear`. В таком случае компонент добавит классы `${name}-appear-from`, `${name}-appear-active` и `${name}-appear-to` во время анимации и вызовет ивенты `onBeforeAppear`, `onAppear` и `onAfterAppear`.

```jsx
<Transition name="fade" visible={visible} appear customAppear>
  {/* ... */}
</Transition>
```

### Custom classes

Если вы не хотите, чтобы ваши классы были сгенерированы из `name`'а, тогда вы можете передать свои классы через props'ы. Они будут иметь более высокий приоритет перед сгенерированными классами.

```jsx
<Transition
  name="fade"
  enterFromClass="class-1"
  enterActiveClass="class-2"
  enterToClass="class-3"
  leaveFromClass="class-4"
  leaveActiveClass="class-5"
  leaveToClass="class-6"
  appearFromClass="class-7"
  appearActiveClass="class-8"
  appearToClass="class-9"
>
  {/* ... */}
</Transition>
```

### JavaScript ивенты

`<Transition>` компонент имеет javascript ивенты для каждой фазы анимации.

```jsx
<Transition
  name="fade"
  visible={visible}
  onBeforeEnter={onBeforeEnter}
  onEnter={onEnter}
  onAfterEnter={onAfterEnter}
  onBeforeLeave={onBeforeLeave}
  onLeave={onLeave}
  onAfterLeave={onAfterLeave}
  // срабатют только с `customAppear`
  onBeforeAppear={onBeforeAppear}
  onAppear={onAppear}
  onAfterAppear={onAfterAppear}
>
  {/* ... */}
</Transition>
```

### Анимирование элементов списка

Пока мы рассматривали только анимирование одного элемента. Но что делать, если мы хотим анимировать элементы списка? Для этого есть компонент `<TransitionGroup />`. Он работает как стейт машина, которая определяет что элемент списка был добавлен/удален и передает корректные props'ы в дочерние `<Transition>` компоненты.

[Попробовать в codesandbox](https://codesandbox.io/s/transition-group-list-no-move-8ww7h)

```jsx
import React, { useState } from "react";
import { Transition, TransitionGroup } from "retransition";

import "./index.css";

const getRandomIndex = length => Math.floor(Math.random() * length);

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

  return (
    <>
      <button onClick={add} style={{ marginRight: 5 }}>
        Add
      </button>
      <button onClick={remove} style={{ marginRight: 5 }}>
        Remove
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

```css
.fade-leave-to,
.fade-enter-from {
  transform: translateX(200px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 500ms ease, transform 500ms ease;
}

.fade-leave-active {
  /* 
    note that we add absolute position to leaving element
    so other elements change their position and trigger move transition 
  */
  position: absolute;
}

.fade-leave-from,
.fade-enter-to {
  transform: translateX(0);
  opacity: 1;
}
```

> Заметьте что вы можете передать `name` в компонент `<TransitionGroup>` и оно будет использован для всех дочерних `<Transition>` компонентов.

### Анимирование перемещения элементов списка

У нас еще есть одна проблема с прошлым примером. Когда мы добавляем/удаляем элемент списка, остальные элементы "прыгают" в свое новое положение. Давайте посмотрим как это можно исправить.

`<TransitionGroup>` добавляет `${name}-move` класс свои дочерним элементам когда они меняют свое положение. Давайте подправим наш прошлый пример и посмотрим что получиться.

[Попробовать в codesandbox](https://codesandbox.io/s/transition-group-list-example-dkw6e?file=/src/App.js)

```diff
import React, { useState } from "react";
import { Transition, TransitionGroup } from "retransition";
+import { shuffle } from "lodash-es";

import "./index.css";

const getRandomIndex = length => Math.floor(Math.random() * length);

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

+ const reorder = () => {
+   setNumbers(n => shuffle(n));
+ };

  return (
    <>
      <button onClick={add} style={{ marginRight: 5 }}>
        Add
      </button>
      <button onClick={remove} style={{ marginRight: 5 }}>
        Remove
      </button>
+     <button onClick={reorder} style={{ marginRight: 5 }}>
+       Shuffle
+     </button>
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

```diff
.fade-leave-to,
.fade-enter-from {
  transform: translateX(200px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 500ms ease, transform 500ms ease;
}

.fade-leave-active {
  /*
    note that we add absolute position to leaving element
    so other elements change their position and trigger move transition
  */
  position: absolute;
}

.fade-leave-from,
.fade-enter-to {
  transform: translateX(0);
  opacity: 1;
}

+.fade-move {
+  transition: transform 500ms ease;
+}
```

### Кастомный класс

Вы можете использовать кастомный класс для анимации перемещения, если не хотите использовать дефолтный. Для этого передайте prop `moveClass`.

<!-- prettier-ignore -->
```jsx
<Transition moveClass="my-move-class">
  {/* ... */}
</Transition>
```

### Важное замечание по поводу анимации перемещения

Когда вы используете компонент `<TransitionGroup>`, он предполагает что вы хотите также анимировать перемещения элементов списка. В результате `moveClass` будет добавляться к дочерним элементам, при смене позиции. Однако если стили для этого класса не имеют транзишена, то он не будет удален (в отличии от компонента `<Transiton>`, который определяет, есть ли у элемента анимация/транзишн, и удалит все классы, если нет). Связанно это с тем что `<TransitonGroup>`, не проверяет есть ли у каждого дочернего элемента транзишн, так как это может вызвать проблемы с производительностью (для больших списков). Поэтому если вы не планируете анимировать перемещение и не хотите иметь ненужные классы на элементах - передайте prop `moveTransiton={false}`

<!-- prettier-ignore -->
```jsx
<TransitionGroup moveTransition={false}>
  {/* ... */}
</TransitionGroup>
```

### Еще один пример

С помощью "move" класса вы можете создавать крутые анимации. Посмотрите, например, на этот пример.

[Попробовать в codesandbox](https://codesandbox.io/s/sudoku-example-86zxw?file=/src/App.js)

```jsx
import React, { useState } from "react";
import { Transition, TransitionGroup } from "retransition";
import { shuffle } from "lodash-es";

import "./index.css";

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

```css
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

## API

### Transition

#### Props

<!-- prettier-ignore -->
| имя  | тип | значение по умолчанию | описание|
| --- | --- | --- | --- | 
| visible           | `boolean`                 | `false`                       | Определяет видимость компонента. Запускает анимацию при изменении |
| name              | `string`                  | `transition`                  | Имя анимации. Используется для генерации классов анимации |
| appear            | `boolean`                 | `false`                       | Определяет нужно ли запускать анимацию при первоначальном рендере. |
| customAppear      | `boolean`                 | `false`                       | По дефолту анимация первоначального появления (`appear`) использует классы и ивенты анимации обычно появления (`enter`). Если вы хотите генерировать кастомные классы и использовать кастомные ивенты, передайте `true` |
| nodeRef           | `React.MutableRef<Element \| null> \| ((node: Element) => void` | `undefined` | `<Transition />` компонент использует `ref` для получения дочернего DOM элемента. Если вы тоже хотите использовать `ref` для дочернего элемента, передайте его компоненту `<Transition>` |
| unmount           | `boolean`                 | `true`                        | По дефолту, дочерний элемент будет демонтирован при исчезновении. Если вы хотите чтобы он был скрыт с помощью `display: none`, передайте `false`.  |
| type              | `'animation' \| 'transition' \| undefined` | `undefined` | Какой тип анимации (`transition` или `animation`) должен использоваться для определения завершения анимации. |
| enterFromClass    | `string`                  | `` `${name}-enter-from` ``    | Класс задающий начальное состояние анимации появления. |
| enterActiveClass  | `string`                  | `` `${name}-enter-to` ``      | Класс задающий активное состояние анимации появления. Используйте его для определения длительности и временной функции. |
| enterToClass      | `string`                  | `` `${name}-enter-active` ``  | Класс задающий конечное состояние анимации появления. |
| leaveFromClass    | `string`                  | `` `${name}-leave-from` ``    | Класс задающий начальное состояние анимации исчезновения. |
| leaveActiveClass  | `string`                  | `` `${name}-leave-active` ``  | Класс задающий активное состояние анимации исчезновения. Используйте его для определения длительности и временной функции.  |
| leaveToClass      | `string`                  | `` `${name}-leave-to` ``      | Класс задающий конечное состояние анимации исчезновения. |
| appearFromClass   | `string`                  | `` `enterFromClass` ``   | Класс задающий начальное состояние анимации первоначального появления (`appear`). По дефолту используется `enterFromClass`. Чтобы поменять `customAppear` prop. |             
| appearActiveClass | `string`                  | `` `enterActiveClass` `` | Класс задающий активное состояние анимации первоначального появления (`appear`). Используйте его для определения длительности и временной функции. |
| appearToClass     | `string`                  | `` `enterToClass` ``     | Класс задающий конечное состояние анимации первоначального появления (`appear`). |
| onBeforeEnter | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается перед тем как добавляются `enterFromClass` и `enterActiveClass`. |
| onEnter | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается после добавления `enterFromClass` и `enterActiveClass`. |
| onAfterEnter | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается когда анимация появления окончена и все классы анимации удалены. |
| onBeforeLeave | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается перед тем как добавляются `leaveFromClass` и `leaveActiveClass`. |
| onLeave | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается после добавления `leaveFromClass` и `leaveActiveClass`. |
| onAfterLeave | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается когда анимация исчезновения окончена и все классы анимации удалены. |
| onBeforeAppear | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается перед тем как добавляются `appearFromClass` и `appearActiveClass`. |
| onAppear | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается после добавления `appearFromClass` и `appearActiveClass`. |
| onAfterAppear | `(el: Element) => void`|`undefined` | JavaScript ивент. Вызывается когда анимация первоначального появления (`appear`) окончена и все классы анимации удалены. |

### TransitionGroup

#### Props

<!-- prettier-ignore -->
| имя | тип | значение по умолчанию | описание |
| --------- | -------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| name      | `string`             | `transition`         | Имя для дочерних `<Transition>` компонентов. Также используется для генерации `moveClass` props'а, если он не передан  |
| moveClass | `string`             | `` `${name}-move` `` | Класс который будет добавлен дочерним элементам, поменявшим позицию |
| appear    | `boolean`            | `false`              | Определяет нужно ли запускать анимацию списка при первоначальном рендере. |
| moveTransition  | `boolean \| undefined` | `undefined` | Определяет должен ли `<TransitionGroup>` иметь move анимацию (перемещения элементов). |
| children  | `React.ReactElement` | -                    | Компоненты `<Transition />` |

## Contributing

Если есть какие-то вопросы или предложения, не поленитесь открыть issue или pull request.

## Лицензия

MIT.
