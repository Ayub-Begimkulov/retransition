import React, { useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { TransitionGroupContext } from "./context";
import { useHasChanged, useIsMounted, usePrevious } from "./hooks";
import { TransitionProps } from "./Transition";
import {
  addClass,
  combine,
  getTransitionInfo,
  hasOwn,
  mapObject,
  removeClass,
} from "./utils";
import { getChildMapping, mergeChildMappings } from "./utils/children";

const positionMap = new WeakMap<Element, { top: number; left: number }>();
const newPositionMap = new WeakMap<Element, { top: number; left: number }>();

// TODO correct props
export interface TransitionGroupProps {
  name?: string;
  appear?: boolean;
  moveClass?: string;
  children:
    | React.ReactElement<TransitionProps>
    | React.ReactElement<TransitionProps>[];
}

// TODO
// 1) should transition group have an appear prop? if yes, how should it work
// should it override a children props? or should it just compliment it?
// 2) problem with updating parent component (transition stops)
// 3) think about unnecessary `recordPosition` calls during rerender
const TransitionGroup = ({
  name,
  appear,
  moveClass,
  children,
}: TransitionGroupProps) => {
  const isMounted = useIsMounted();
  const newChildrenElements = useRef<Element[]>([]);
  const prevChildrenElements = useRef<Element[]>([]);

  const childrenChanged = useHasChanged(children);

  if (childrenChanged && prevChildrenElements.current.length > 0) {
    prevChildrenElements.current.forEach(recordPosition);
  }

  const ctxValue = useMemo(
    () => ({
      // TODO maybe it's better to override child props according to
      // isMounted instead of passing it though context
      get isAppear() {
        return !isMounted.current;
      },
      register(el: Element) {
        newChildrenElements.current.push(el);
      },
      unregister(el: Element) {
        // TODO use map/object for performance?
        prevChildrenElements.current = prevChildrenElements.current.filter(
          e => e !== el
        );
      },
    }),
    [isMounted]
  );

  useLayoutEffect(() => {
    const updateChildren = () => {
      if (newChildrenElements.current.length > 0) {
        prevChildrenElements.current = [
          ...prevChildrenElements.current,
          ...newChildrenElements.current,
        ];
        newChildrenElements.current = [];
      }
    };
    // TODO refactor this shit
    const moveCls = moveClass || `${name || "transition"}-move`;
    const childrenToMove = prevChildrenElements.current;
    let hasTransform = false;
    if (childrenToMove[0]) {
      childrenToMove[0].classList.add(moveCls);
      hasTransform = getTransitionInfo(childrenToMove[0]).hasTransform;
      childrenToMove[0].classList.remove(moveCls);
    }
    if (!isMounted.current || !hasTransform) {
      updateChildren();
      return;
    }
    // 3 separate loops for performance
    // https://stackoverflow.com/questions/19250971/why-a-tiny-reordering-of-dom-read-write-operations-causes-a-huge-performance-dif
    childrenToMove.forEach(el => (el as any)._endCb?.());
    childrenToMove.forEach(recordNewPosition);
    const movedChildren = childrenToMove.filter(applyTranslation);
    forceReflow();

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
      // TODO think about performance issues if using
      // whenTransitionEnds here
      child.addEventListener("transitionend", endCb);
    });
    updateChildren();
  }, [children, moveClass, name, isMounted]);

  const childrenToRender = useTransitionChildren(children, appear);
  return (
    <TransitionGroupContext.Provider value={ctxValue}>
      {mapObject(childrenToRender, (value, key) => {
        return React.cloneElement(value, {
          key,
          // TODO should it override name?
          name,
        });
      })}
    </TransitionGroupContext.Provider>
  );
};

const getProp = (el: React.ReactElement, key: string) => {
  if (!hasOwn(el.props, key)) return;
  return el.props[key];
};

function useTransitionChildren(
  children: React.ReactElement | React.ReactElement[],
  appear?: boolean
) {
  // TODO think about different way to update children
  const [, forceRerender] = useReducer(x => x + 1, 0);
  const currentChildren = getChildMapping(children);
  const prevChildrenMapping = usePrevious(currentChildren);

  const newChildren = currentChildren;
  const prevChildren = prevChildrenMapping.current;

  const result = {} as typeof newChildren;
  if (!prevChildren) {
    for (const key in newChildren) {
      const childAppear = getProp(newChildren[key], "appear");
      result[key] = React.cloneElement(newChildren[key], {
        visible: true,
        appear: typeof childAppear === "boolean" ? childAppear : appear,
      });
    }
  } else {
    const mapping = mergeChildMappings(prevChildren, newChildren);
    for (const key in mapping) {
      const isOld = hasOwn(prevChildren, key);
      const isNew = hasOwn(newChildren, key);
      // item is deleted
      if (isOld && !isNew) {
        const onAfterLeaveProp = getProp(prevChildren[key], "onAfterLeave");
        result[key] = React.cloneElement(prevChildren[key], {
          visible: false,
          onAfterLeave: onAfterLeaveProp
            ? combine(onAfterLeaveProp, forceRerender)
            : forceRerender,
        });
      } else if (isNew) {
        result[key] = React.cloneElement(newChildren[key], {
          visible: true,
          // TODO is it useful?
          appear: true,
        });
      } else {
        result[key] = React.cloneElement(newChildren[key], { visible: true });
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
  s.transform = `translate(${dx}px,${dy}px)`;
  s.transitionDuration = "0";
  return c;
}

function forceReflow() {
  return document.body.offsetHeight;
}

export default TransitionGroup;
