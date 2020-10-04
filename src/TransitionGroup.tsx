import React, { useCallback, useLayoutEffect, useRef } from "react";

const positionMap = new WeakMap<Element, { top: number; left: number }>();
const newPositionMap = new WeakMap<Element, { top: number; left: number }>();

function applyTranslation(c: Element) {
  const oldPos = positionMap.get(c)!;
  const newPos = newPositionMap.get(c)!;
  const dx = oldPos.left - newPos.left;
  const dy = oldPos.top - newPos.top;

  if (dx || dy) {
    const s = (c as HTMLElement).style;
    s.transform = s.webkitTransform = `translate(${dx}px,${dy}px)`;
    s.transitionDuration = "0";
    return c;
  }
  return;
}

function forceReflow() {
  return document.body.offsetHeight;
}

interface TransitionGroupProps {
  name?: string;
  moveClass?: string;
}

const TransitionGroup: React.FC<TransitionGroupProps> = ({
  name = "transition",
  moveClass,
  children,
}) => {
  const isFirst = useRef(true);

  useLayoutEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (rootEl.current) {
      const childrenElements = [...rootEl.current.children];
      childrenElements.forEach(el => {
        newPositionMap.set(el, el.getBoundingClientRect());
      });
      const movedChildren = childrenElements.filter(applyTranslation);

      forceReflow();

      const moveCls = moveClass || `${name}-move`;
      movedChildren.forEach(child => {
        child.classList.add(moveCls);
        positionMap.set(child, newPositionMap.get(child)!);
        (child as HTMLElement).style.transitionDuration = "";
        (child as HTMLElement).style.transform = "";
        child.addEventListener("transitionend", () => {
          child.classList.remove(moveCls);
        });
      });
    }
  });

  const rootEl = useRef<HTMLDivElement>(null);

  const ref = useCallback((node: Element | null) => {
    if (node) {
      positionMap.set(node, node.getBoundingClientRect());
    }
  }, []);

  return (
    <div ref={rootEl}>
      {React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child: React.ReactElement) => {
          return React.cloneElement(child, {
            ref,
            ...child.props,
          });
        })}
    </div>
  );
};

const guard = Symbol("guard");

// @ts-ignore
function useLazyRef<T>(value: () => T) {
  const ref = useRef<T | typeof guard>(guard);
  if (ref.current === guard) {
    ref.current = value();
  }
  return ref as React.MutableRefObject<T>;
}

export default TransitionGroup;
