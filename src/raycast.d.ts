import type { ReactElement } from 'react';

declare global {
  namespace JSX {
    type Element = ReactElement<any, any>;
    type ElementType = any;
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}
