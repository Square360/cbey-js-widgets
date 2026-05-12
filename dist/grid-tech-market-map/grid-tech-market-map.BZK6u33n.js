import p from"window.CbeyReact.React";var _={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var i=p,s=Symbol.for("react.element"),y=Symbol.for("react.fragment"),m=Object.prototype.hasOwnProperty,c=i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,d={key:!0,ref:!0,__self:!0,__source:!0};function l(t,r,f){var e,o={},n=null,u=null;f!==void 0&&(n=""+f),r.key!==void 0&&(n=""+r.key),r.ref!==void 0&&(u=r.ref);for(e in r)m.call(r,e)&&!d.hasOwnProperty(e)&&(o[e]=r[e]);if(t&&t.defaultProps)for(e in r=t.defaultProps,r)o[e]===void 0&&(o[e]=r[e]);return{$$typeof:s,type:t,key:n,ref:u,props:o,_owner:c.current}}_.Fragment=y;_.jsx=l;_.jsxs=l;
