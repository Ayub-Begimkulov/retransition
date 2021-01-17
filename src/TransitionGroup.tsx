import React, { useLayoutEffect, useMemo, useReducer, useRef } from "react";
import { TransitionGroupContext } from "./context";
import { useHasChanged, useIsMounted, usePrevious } from "./hooks";
import { TransitionProps } from "./Transition";
import { addClass, combine, hasOwn, mapObject, removeClass } from "./utils";
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
const TransitionGroup = React.memo(
  ({ name, appear, moveClass, children }: TransitionGroupProps) => {
    const isMounted = useIsMounted();
    const newChildrenElements = useRef<Element[]>([]);
    const prevChildrenElements = useRef<Element[]>([]);

    const childrenChanged = useHasChanged(children);
    // TODO can you pass info from memo compare function
    // so we don't need to check for children difference
    if (childrenChanged && prevChildrenElements.current.length > 0) {
      prevChildrenElements.current.forEach(recordPosition);
    }

    const ctxValue = useMemo(
      () => ({
        // TODO maybe it's better to override child props according to
        // isMounted instead of passing it though context
        // TODO rename getter name
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
      const moveCls = moveClass || `${name || "transition"}-move`;
      const childrenToMove = prevChildrenElements.current;
      // TODO think about `hasTransform` logic
      // what should you do if user passes
      // different classes to each child of <TransitionGroup />
      // and some of them doesn't have the transition
      // so we would add unnecessary classes and they won't get
      // removed
      // let hasTransform = false;
      // if (childrenToMove[0]) {
      //   childrenToMove[0].classList.add(moveCls);
      //   hasTransform = getTransitionInfo(childrenToMove[0]).hasTransform;
      //   childrenToMove[0].classList.remove(moveCls);
      // }
      if (!isMounted.current /*  || !hasTransform */) {
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
        {mapObject(childrenToRender, value => {
          return React.cloneElement(value, {
            // TODO pass everything from `useTransitionChildren`
            // TODO should it override name?
            name,
          });
        })}
      </TransitionGroupContext.Provider>
    );
  },
  arePropsEqual
);

// TODO run benchmarks and improve performance
function arePropsEqual(
  prevProps: TransitionGroupProps,
  nextProps: TransitionGroupProps
) {
  if (Object.is(prevProps, nextProps)) {
    return true;
  }
  const prevKeys = Object.keys(prevProps) as (keyof TransitionGroupProps)[];
  const nextKeys = Object.keys(nextProps) as (keyof TransitionGroupProps)[];
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  if (prevKeys.every((k, i) => k !== nextKeys[i])) {
    return false;
  }
  for (let i = 0, l = prevKeys.length; i < l; i++) {
    const key = prevKeys[i];
    if (key === "children") {
      const prevChildren = React.Children.toArray(
        prevProps["children"]
      ) as React.ReactElement[];
      const nextChildren = React.Children.toArray(
        nextProps["children"]
      ) as React.ReactElement[];
      if (prevChildren.length !== nextChildren.length) {
        return false;
      }
      if (!prevChildren.every((c, i) => c.key === nextChildren[i].key)) {
        return false;
      }
      continue;
    }
    if (!Object.is(prevProps[key], nextProps[key])) {
      return false;
    }
  }
  return true;
}

const getProp = (el: React.ReactElement, key: string, defaultValue?: any) => {
  if (!hasOwn(el.props, key)) return defaultValue;
  return el.props[key];
};

function useTransitionChildren(
  children: React.ReactElement | React.ReactElement[],
  appear: boolean | undefined
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
      const childAppear = getProp(newChildren[key], "appear", appear);
      result[key] = React.cloneElement(newChildren[key], {
        key,
        visible: true,
        appear: childAppear,
      });
    }
  } else {
    const mapping = mergeChildMappings(prevChildren, newChildren);
    for (const key in mapping) {
      const isOld = hasOwn(prevChildren, key);
      const isNew = hasOwn(newChildren, key);
      if (isOld && !isNew) {
        // deleted item
        const onAfterLeaveProp = getProp(prevChildren[key], "onAfterLeave");
        result[key] = React.cloneElement(prevChildren[key], {
          visible: false,
          onAfterLeave: onAfterLeaveProp
            ? combine(onAfterLeaveProp, forceRerender)
            : forceRerender,
        });
      } else if (isNew) {
        // new item
        result[key] = React.cloneElement(newChildren[key], {
          key,
          visible: true,
          // TODO could mounted be `false` here?
          appear: true, //getProp(newChildren[key], "appear", appear) && !mounted,
        });
      } else {
        // old item
        result[key] = React.cloneElement(newChildren[key], {
          key,
          visible: true,
        });
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
