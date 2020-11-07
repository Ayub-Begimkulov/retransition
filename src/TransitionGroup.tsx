import React, { useCallback, useLayoutEffect, useRef } from "react";
import { TransitionProps } from "Transition";
// import { usePrevious } from "hooks";
import { addClass, removeClass } from "utils";

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

interface TransitionGroupProps extends Omit<TransitionProps, "visible"> {
  tag?: string;
  moveClass?: string;
  className?: string;
}

const TransitionGroup: React.FC<TransitionGroupProps> = ({
  name = "transition",
  moveClass,
  children,
  className,
}) => {
  const isFirst = useRef(true);
  const childrenElements = useRef<Element[]>([]);
  const prevChildrenElements = useRef<Element[]>([]);

  // const childrenArray = React.Children.toArray(children);
  // const prevChildren = usePrevious(childrenArray);

  /* const areChildrenSame = ((arr1, arr2) => {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
      return false;
    }
    if (arr1.length !== arr2.length) {
      return false;
    }
    return arr1.every(
      (item, i) =>
        item === arr2[i] || (item as any).key === (arr2[i] as any).key
    );
  })(prevChildren.current, childrenArray); */

  // console.log(areChildrenSame);

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
        // console.log("return");
        return;
      }
      // console.log("not return");
      // const prevChildrenSet = new Set(prevChildrenElements.current);
      // const childrenSet = new Set(childrenElements.current);
      // const removedElements = prevChildrenElements.current.filter(
      //   child => !childrenSet.has(child)
      // );
      // const addedElements = childrenElements.current.filter(
      //   child => !prevChildrenSet.has(child)
      // );
      // console.log({ addedElements, removedElements });
      // childrenElements.current.forEach((el: any) => {
      //   el._pendingCb && el._pendingCb();
      //   el._pendingCb = null;
      // });
      childrenElements.current.forEach(el => {
        newPositionMap.set(el, el.getBoundingClientRect());
      });
      const movedChildren = childrenElements.current.filter(applyTranslation);

      forceReflow();
      const moveCls = moveClass || `${name}-move`;
      movedChildren.forEach(child => {
        addClass(child, moveCls);
        positionMap.set(child, newPositionMap.get(child)!);
        (child as HTMLElement).style.transitionDuration = "";
        (child as HTMLElement).style.transform = "";
        child.addEventListener("transitionend", () => {
          removeClass(child, moveCls);
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
    <div className={className} ref={rootEl}>
      {React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((child: React.ReactElement) => {
          return React.cloneElement(child, {
            ref,
          });
        })}
    </div>
  );
};

export default TransitionGroup;
