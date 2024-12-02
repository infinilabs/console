// views namespace:
export { indexPatterns, esQuery } from "../../data/public";

export {
  IndexPattern,
  IndexPatternField,
  DuplicateIndexPatternError,
} from "../../data/common";
export type Query = {
  query: string | { [key: string]: any };
  language: string;
};

/* react-router-navigate (kibana_react/public)*/

import { History, parsePath } from "history";

interface LocationObject {
  pathname?: string;
  search?: string;
  hash?: string;
}

const isModifiedEvent = (event: any) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

const isLeftClickEvent = (event: any) => event.button === 0;

export const toLocationObject = (to: string | LocationObject) =>
  typeof to === "string" ? parsePath(to) : to;

export const reactRouterNavigate = (
  history: History,
  to: string | LocationObject,
  onClickCallback?: Function
) => ({
  href: history.createHref(toLocationObject(to)),
  onClick: reactRouterOnClickHandler(
    history,
    toLocationObject(to),
    onClickCallback
  ),
});

export const reactRouterOnClickHandler = (
  history: History,
  to: string | LocationObject,
  onClickCallback?: Function
) => (event: any) => {
  if (onClickCallback) {
    onClickCallback(event);
  }

  if (event.defaultPrevented) {
    return;
  }

  if (event.target.getAttribute("target")) {
    return;
  }

  if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
    return;
  }

  // prevents page reload
  event.preventDefault();
  history.push(toLocationObject(to));
};

export const docLinks = {};

/* start  field_wildcard(utils/public */
import { escapeRegExp, memoize } from "lodash";

// @internal
export const makeRegEx = memoize(function makeRegEx(glob: string) {
  const globRegex = glob
    .split("*")
    .map(escapeRegExp)
    .join(".*");
  return new RegExp(`^${globRegex}$`);
});

// Note that this will return an essentially noop function if globs is undefined.
export function fieldWildcardMatcher(
  globs: string[] = [],
  metaFields: unknown[] = []
) {
  return function matcher(val: unknown) {
    // do not test metaFields or keyword
    if (metaFields.indexOf(val) !== -1) {
      return false;
    }
    return globs.some((p) => makeRegEx(p).test(`${val}`));
  };
}

// Note that this will return an essentially noop function if globs is undefined.
export function fieldWildcardFilter(
  globs: string[] = [],
  metaFields: string[] = []
) {
  const matcher = fieldWildcardMatcher(globs, metaFields);
  return function filter(val: unknown) {
    return !matcher(val);
  };
}

import {
  keys,
  isFunction,
  difference,
  filter,
  union,
  pick,
  each,
  assign,
  isEqual,
} from "lodash";

export interface IDiffObject {
  removed: string[];
  added: string[];
  changed: string[];
  keys: string[];
}

/**
 * Filter the private vars
 * @param {string} key The keys
 * @returns {boolean}
 */
const filterPrivateAndMethods = function(obj: Record<string, any>) {
  return function(key: string) {
    if (isFunction(obj[key])) return false;
    if (key.charAt(0) === "$") return false;
    return key.charAt(0) !== "_";
  };
};

export function applyDiff(
  target: Record<string, any>,
  source: Record<string, any>
) {
  const diff: IDiffObject = {
    removed: [],
    added: [],
    changed: [],
    keys: [],
  };

  const targetKeys = keys(target).filter(filterPrivateAndMethods(target));
  const sourceKeys = keys(source).filter(filterPrivateAndMethods(source));

  // Find the keys to be removed
  diff.removed = difference(targetKeys, sourceKeys);

  // Find the keys to be added
  diff.added = difference(sourceKeys, targetKeys);

  // Find the keys that will be changed
  diff.changed = filter(
    sourceKeys,
    (key) => !isEqual(target[key], source[key])
  );

  // Make a list of all the keys that are changing
  diff.keys = union(diff.changed, diff.removed, diff.added);

  // Remove all the keys
  each(diff.removed, (key) => {
    delete target[key];
  });

  // Assign the changed to the source to the target
  assign(target, pick(source, diff.changed));
  // Assign the added to the source to the target
  assign(target, pick(source, diff.added));

  return diff;
}
import {
  MonoTypeOperatorFunction,
  queueScheduler,
  scheduled,
  from,
} from "rxjs";
import { concatAll, distinctUntilChanged, skip } from "rxjs/operators";

export function distinctUntilChangedWithInitialValue<T>(
  initialValue: T | Promise<T>,
  compare?: (x: T, y: T) => boolean
): MonoTypeOperatorFunction<T> {
  return (input$) =>
    scheduled(
      [isPromise(initialValue) ? from(initialValue) : [initialValue], input$],
      queueScheduler
    ).pipe(concatAll(), distinctUntilChanged(compare), skip(1));
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return (
    !!value &&
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function" &&
    !("subscribe" in value)
  );
}

export {
  syncState,
  createKbnUrlStateStorage,
} from "../../utils/public/state_sync";

import { BehaviorSubject } from "rxjs";
const $$observable =
  (typeof Symbol === "function" && (Symbol as any).observable) ||
  "@@observable";
const $$setActionType = "@@SET";
const defaultFreeze = (value) => value;
//  <T>(value: T): T => {
//       const isFreezable = value !== null && typeof value === 'object';
//       if (isFreezable) return deepFreeze(value) as T;
//       return value as T;
//     };
export function createStateContainer(
  defaultState,
  pureTransitions, // TODO: https://github.com/elastic/kibana/issues/54439
  pureSelectors = {}, // TODO: https://github.com/elastic/kibana/issues/54439
  options = {}
) {
  const { freeze = defaultFreeze } = options;
  const data$ = new BehaviorSubject(freeze(defaultState));
  const state$ = data$.pipe(skip(1));
  const get = () => data$.getValue();
  const container = {
    get,
    state$,
    getState: () => data$.getValue(),
    set: (state) => {
      container.dispatch({ type: $$setActionType, args: [state] });
    },
    reducer: (state, action) => {
      if (action.type === $$setActionType) {
        return freeze(action.args[0]);
      }

      const pureTransition = pureTransitions[action.type];
      return pureTransition
        ? freeze(pureTransition(state)(...action.args))
        : state;
    },
    replaceReducer: (nextReducer) => (container.reducer = nextReducer),
    dispatch: (action) => data$.next(container.reducer(get(), action)),
    transitions: Object.keys(pureTransitions).reduce(
      (acc, type) => ({
        ...acc,
        [type]: (...args: any) => container.dispatch({ type, args }),
      }),
      {}
    ),
    selectors: Object.keys(pureSelectors).reduce(
      (acc, selector) => ({
        ...acc,
        [selector]: (...args: any) =>
          (pureSelectors as any)[selector](get())(...args),
      }),
      {}
    ),
    addMiddleware: (middleware) =>
      (container.dispatch = middleware(container as any)(container.dispatch)),
    subscribe: (listener: (state) => void) => {
      const subscription = state$.subscribe(listener);
      return () => subscription.unsubscribe();
    },
    [$$observable]: state$,
  };
  return container;
}

/* end  field_wildcard(utils/public */
