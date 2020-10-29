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

function areArraysEqual(arr1: any[], arr2: any[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
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
  const childrenElements = useRef<Element[]>([]);
  const prevChildrenElements = useRef<Element[]>([]);

  useLayoutEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (rootEl.current) {
      prevChildrenElements.current = childrenElements.current;
      childrenElements.current = [...rootEl.current.children];
      if (
        areArraysEqual(childrenElements.current, prevChildrenElements.current)
      ) {
        return;
      }
      childrenElements.current.forEach(el => {
        newPositionMap.set(el, el.getBoundingClientRect());
      });
      const movedChildren = childrenElements.current.filter(applyTranslation);

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
  }, [children]);

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

export default TransitionGroup;
