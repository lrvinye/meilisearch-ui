import { cn } from '@/lib/cn';
import type { FC } from 'react';
import meiliLOGO from '@/assets/meili-logo.svg';

export const Logo: FC<{
  className?: string;
  href?: string;
}> = ({ className, href }) => {
  return (
    <a
      className={cn(className, 'flex justify-center items-center')}
      href={href || 'https://meilisearch.com'}
      target="_blank"
      rel="noreferrer"
    >
      <img src={meiliLOGO} className={'logo flex-1'} alt="Meili logo" />
    </a>
  );
};
