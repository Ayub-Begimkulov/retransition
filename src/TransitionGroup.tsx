import React, { useLayoutEffect, useReducer, useRef } from "react";
import { useHasChanged, useIsMounted, usePrevious } from "./hooks";
import Transition, { TransitionProps } from "./Transition";
import { addClass, hasOwn, removeClass } from "./utils";
import { getChildMapping, mergeChildMappings } from "./utils/children";

const positionMap = new WeakMap<Element, { top: number; left: number }>();
const newPositionMap = new WeakMap<Element, { top: number; left: number }>();

interface TransitionGroupProps
  extends Omit<TransitionProps, "visible" | "children"> {
  tag?: keyof JSX.IntrinsicElements;
  moveClass?: string;
  className?: string;
}

const TransitionGroup: React.FC<TransitionGroupProps> = ({
  name = "transition",
  // tag: Tag = "div",
  moveClass,
  children,
  className,
}) => {
  const isMounted = useIsMounted();
  const prevChildrenElements = useRef<Element[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);

  const childrenChanged = useHasChanged(children);

  if (childrenChanged && prevChildrenElements.current.length > 0) {
    prevChildrenElements.current.forEach(recordPosition);
  }

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const childrenElements = [...root.children];
    if (!isMounted.current) {
      prevChildrenElements.current = childrenElements;
      return;
    }
    const childrenToMove = prevChildrenElements.current;
    childrenToMove.forEach(el => (el as any)._endCb?.());
    childrenToMove.forEach(recordNewPosition);
    const movedChildren = childrenToMove.filter(applyTranslation);
    forceReflow();

    const moveCls = moveClass || `${name}-move`;
    movedChildren.forEach(child => {
      addClass(child, moveCls);
      (child as HTMLElement).style.transitionDuration = "";
      (child as HTMLElement).style.transform = "";
      const endCb = ((child as any)._endCb = (e?: Event) => {
        if (e && e.target !== child) {
          return;
        }
        if (!e || /transform$/.test((e as TransitionEvent).propertyName)) {
          child.removeEventListener("transitionend", endCb);
          (child as any)._endCb = null;
          removeClass(child, moveCls);
        }
      });
      child.addEventListener("transitionend", endCb);
    });
    prevChildrenElements.current = childrenElements;
  }, [children, moveClass, name, isMounted]);

  const childrenToRender = useTransitionChildren(children);

  const keysToRender = Object.keys(childrenToRender);

  return (
    <div className={className} ref={rootRef}>
      {keysToRender.map(key => {
        return React.cloneElement(childrenToRender[key], {
          key,
          appear: true,
          name,
        });
      })}
    </div>
  );
};

function useTransitionChildren(children: React.ReactNode) {
  const [, forceRerender] = useReducer(x => x + 1, 0);
  const currentChildren = getChildMapping(children);
  const prevChildrenMapping = usePrevious(currentChildren);

  const newChildren = currentChildren;
  const prevChildren = prevChildrenMapping.current;

  const result = {} as typeof newChildren;
  if (!prevChildren) {
    for (const key in newChildren) {
      result[key] = <Transition visible={true}>{newChildren[key]}</Transition>;
    }
  } else {
    const mapping = mergeChildMappings(prevChildren, newChildren);
    for (const key in mapping) {
      const isOld = hasOwn(prevChildren, key);
      const isNew = hasOwn(newChildren, key);
      if (isOld && !isNew) {
        result[key] = (
          <Transition visible={false} onAfterLeave={forceRerender}>
            {prevChildren[key]}
          </Transition>
        );
      } else {
        result[key] = (
          <Transition visible={true}>{newChildren[key]}</Transition>
        );
      }
    }
  }
  return result;
}

function recordPosition(el: Element) {
  positionMap.set(el, el.getBoundingClientRect());
}

function recordNewPosition(el: Element) {
  newPositionMap.set(el, el.getBoundingClientRect());
}

function applyTranslation(c: Element) {
  const oldPos = positionMap.get(c);
  const newPos = newPositionMap.get(c);
  if (!oldPos || !newPos) return;
  const dx = oldPos.left - newPos.left;
  const dy = oldPos.top - newPos.top;
  if (!dx && !dy) return;
  const s = (c as HTMLElement).style;
  s.transform = s.webkitTransform = `translate(${dx}px,${dy}px)`;
  s.transitionDuration = "0";
  return c;
}

function forceReflow() {
  return document.body.offsetHeight;
}

export default TransitionGroup;
