import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useMeiliClient } from '@/hooks/useMeiliClient';
import { ReactNode, useMemo } from 'react';
import { Copyable } from '@/components/Copyable';
import { useCurrentIndex } from '@/hooks/useCurrentIndex';
import { LoaderPage } from '@/components/loader';
import { TitleWithUnderline } from '@/components/title';
import { Button } from '@nextui-org/react';
import { IndexPrimaryKey } from '@/components/indexPrimaryKey';
import { TimeAgo } from '@/components/timeago';
import { useInstanceStats } from '@/hooks/useInstanceStats';
import { Skeleton } from '@douyinfe/semi-ui';
import { filesize } from 'filesize';

const InfoRow = ({ value, label }: { label: string; value: ReactNode }) => {
  return (
    <div className="px-2 text-xs font-400">
      <p className="text-sm font-600">{label}</p>
      {value}
    </div>
  );
};

function IndexDash() {
  const { t } = useTranslation('index');
  const client = useMeiliClient();
  const currentIndex = useCurrentIndex(client);
  const stats = useInstanceStats(client);

  console.debug('index dash page building', currentIndex);

  return useMemo(() => {
    return (
      <div className="flex-1 grid grid-cols-5 laptop:grid-cols-7 overflow-hidden">
        <div className="p-4 flex flex-col gap-4 border-r overflow-hidden">
          <TitleWithUnderline className="scale-95">{`${currentIndex.index?.uid}`}</TitleWithUnderline>
          <InfoRow label="UID" value={<Copyable>{currentIndex.index?.uid || ''}</Copyable>} />
          <InfoRow label={t('common:updated_at')} value={<TimeAgo date={currentIndex.index?.updatedAt} />} />
          {currentIndex.index && (
            <InfoRow
              label={t('primaryKey')}
              value={
                <IndexPrimaryKey
                  afterMutation={() => {
                    window.location.reload();
                  }}
                />
              }
            />
          )}
          <InfoRow
            label={t('instance:db_size')}
            value={
              <Skeleton placeholder={<Skeleton.Title />} active loading={!stats?.databaseSize}>
                {filesize(stats?.databaseSize ?? 0)}
              </Skeleton>
            }
          />
          <div className="flex flex-col gap-3 items-stretch">
            <Link to="" from="/ins/$insID/index/$indexUID">
              <Button fullWidth variant="light" size="sm">
                <div className="flex justify-start items-center w-full gap-2">
                  <div className="i-lucide:square-kanban w-1em h-1em"></div>
                  <div>{t('dashboard')}</div>
                </div>
              </Button>
            </Link>
            <Link to="documents" from="/ins/$insID/index/$indexUID">
              <Button fullWidth variant="light" size="sm">
                <div className="flex justify-start items-center w-full gap-2">
                  <div className="i-lucide:book-text w-1em h-1em"></div>
                  <div>{t('documents')}</div>
                </div>
              </Button>
            </Link>
            <Link to="../../tasks" search={{ indexUids: [currentIndex.index.uid] }} from="/ins/$insID/index/$indexUID">
              <Button fullWidth variant="light" size="sm">
                <div className="flex justify-start items-center w-full gap-2">
                  <div className="i-lucide:workflow w-1em h-1em"></div>
                  <div>{t('tasks')}</div>
                </div>
              </Button>
            </Link>
            <Link to="setting" from="/ins/$insID/index/$indexUID">
              <Button fullWidth variant="light" size="sm">
                <div className="flex justify-start items-center w-full gap-2">
                  <div className="i-lucide:settings w-1em h-1em"></div>
                  <div>{t('settings')}</div>
                </div>
              </Button>
            </Link>
            <Link to="documents/upload" from="/ins/$insID/index/$indexUID">
              <Button fullWidth variant="light" size="sm">
                <div className="flex justify-start items-center w-full gap-2">
                  <div className="i-lucide:upload w-1em h-1em"></div>
                  <div>{t('document:upload_documents')}</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
        <div className="col-start-2 -col-end-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    );
  }, [currentIndex.index, stats?.databaseSize, t]);
}

export const Route = createFileRoute('/ins/$insID/_layout/index/$indexUID/_layout')({
  component: IndexDash,
  pendingComponent: LoaderPage,
});
