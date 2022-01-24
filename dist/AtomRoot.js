import React from 'react';
import { makeDb } from './db';
import { useContext } from 'react';
import { defaultContext, RootContext } from './constants';
import { errorMsg } from './utils';
export function AtomRoot(_a) {
    var children = _a.children;
    var rootDb = useContext(RootContext);
    var isNestedAtomRoot = rootDb !== defaultContext;
    if (isNestedAtomRoot) {
        throw new Error(errorMsg('Application tree may only be wrapped in a single `AtomRoot` component'));
    }
    var db = makeDb({});
    return (React.createElement(RootContext.Provider, { value: db }, children));
}
