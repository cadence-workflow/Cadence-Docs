import React, {type ReactNode} from 'react';
import Paginator from '@theme-original/DocItem/Paginator';
import type PaginatorType from '@theme/DocItem/Paginator';
import type {WrapperProps} from '@docusaurus/types';
import CategoryChildCards from '@site/src/components/CategoryChildCards';

type Props = WrapperProps<typeof PaginatorType>;

export default function DocItemPaginatorWrapper(props: Props): ReactNode {
  return (
    <>
      <Paginator {...props} />
      <CategoryChildCards />
    </>
  );
}
