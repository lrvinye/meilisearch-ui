import { LoaderPage } from '@/components/loader';
import { TimeAgo } from '@/components/timeago';
import { useCurrentInstance } from '@/hooks/useCurrentInstance';
import { useMeiliClient } from '@/hooks/useMeiliClient';
import { hiddenRequestLoader, showRequestLoader } from '@/utils/loader';
import { getDuration } from '@/utils/text';
import { Modal, Select, Table, TagInput } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { Button } from '@nextui-org/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import _ from 'lodash';
import { TasksQuery, Task, TaskTypes, TaskStatus } from 'meilisearch';
import { useEffect, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import ReactJson from 'react-json-view';
import { z } from 'zod';

const searchSchema = z
  .object({
    indexUids: z.string().array().optional(),
    limit: z.number().positive().optional().default(20),
    statuses: z.string().array().optional(),
    types: z.string().array().optional(),
  })
  .optional();

type State = Pick<TasksQuery, 'indexUids' | 'statuses' | 'types'> & Required<Pick<TasksQuery, 'limit' | 'from'>>;

const Page = () => {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();
  const { t } = useTranslation('task');
  const client = useMeiliClient();
  const currentInstance = useCurrentInstance();

  const host = currentInstance?.host;

  const [state, updateState] = useReducer(
    (prev: State, next: Partial<State>) => {
      return { ...prev, ...next };
    },
    { ...searchParams } as State
  );

  useEffect(() => {
    // update search params when state changed
    navigate({
      search: () => ({
        ...state,
      }),
    });
  }, [navigate, state]);

  // @ts-expect-error
  const query = useInfiniteQuery({
    queryKey: ['tasks', host, state],
    queryFn: async ({ pageParam }: { pageParam: { limit: number; from?: number } }) => {
      showRequestLoader();
      console.debug('getTasks', client.config, state);
      return await client.getTasks({
        ..._.omitBy(state, _.isEmpty),
        from: pageParam.from,
        limit: pageParam.limit,
      });
    },
    initialPageParam: {
      limit: state.limit,
    },
    getNextPageParam: (lastPage) => {
      return {
        limit: lastPage.limit,
        from: lastPage.next,
      };
    },
  });

  useEffect(() => {
    if (query.isError) {
      console.warn('get meilisearch tasks error', query.error);
    }
    if (!query.isFetching) {
      hiddenRequestLoader();
    }
  }, [query.error, query.isError, query.isFetching]);

  const list = useMemo(() => {
    return query.data?.pages.map((page) => page.results).reduce((acc, cur) => acc.concat(cur), []) || [];
  }, [query.data?.pages]);

  const columns: ColumnProps<Task>[] = useMemo(
    () => [
      {
        title: 'UID',
        dataIndex: 'uid',
        width: 100,
      },
      {
        title: t('indexes'),
        dataIndex: 'indexUid',
        render: (val) => (val ? <Link to={`/ins/${currentInstance.id}/index/${val}`}>{val}</Link> : '-'),
      },
      {
        title: t('common:type'),
        dataIndex: 'type',
        render: (_) => t(`type.${_}`),
      },
      {
        title: t('common:status'),
        dataIndex: 'status',
        width: 120,
        render: (_) => t(`status.${_}`),
      },
      {
        title: t('duration'),
        dataIndex: 'duration',
        width: 200,
        render: (_, item) => {
          if (!item.duration) {
            return '-';
          }

          return `${getDuration(item.duration, 'millisecond')}ms`;
        },
      },
      {
        title: t('enqueued_at'),
        dataIndex: 'enqueuedAt',
        width: 220,
        render: (_, item) => {
          return <TimeAgo date={item.enqueuedAt} />;
        },
      },
      {
        title: t('started_at'),
        dataIndex: 'startedAt',
        width: 220,
        render: (_, item) => {
          return <TimeAgo date={item.startedAt} />;
        },
      },
      {
        title: t('finished_at'),
        dataIndex: 'finishedAt',
        width: 220,
        render: (_, item) => {
          return <TimeAgo date={item.finishedAt} />;
        },
      },
      {
        title: t('actions'),
        fixed: 'right',
        width: 150,
        render: (_, record) => (
          <div className="flex justify-center items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                Modal.info({
                  title: t('common:detail'),
                  centered: true,
                  footer: null,
                  content: (
                    <div className="flex justify-center items-center p-4 pb-6">
                      <ReactJson
                        name={false}
                        displayDataTypes={false}
                        displayObjectSize={false}
                        enableClipboard={false}
                        src={record}
                        collapsed={3}
                        collapseStringsAfterLength={50}
                      />
                    </div>
                  ),
                });
              }}
              variant="flat"
            >
              {t('common:detail')}
            </Button>
          </div>
        ),
      },
    ],
    [currentInstance.id, t]
  );

  return useMemo(
    () => (
      <div className="flex-1 max-h-fit overflow-hidden">
        <main className="flex flex-col gap-4 h-full">
          <div className={`p-4 flex justify-end items-center gap-4 sticky top-0 z-10 bg-white`}>
            <TagInput
              className="flex-1"
              placeholder={t('filter.index.placeholder')}
              value={state.indexUids}
              onChange={(value) => {
                updateState({ indexUids: value });
              }}
            />
            <Select
              placeholder={t('filter.type.placeholder')}
              optionList={_.entries(t('type', { returnObjects: true }) as Record<string, string>).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
              multiple
              value={state.types}
              onChange={(value) => {
                updateState({ types: (value as TaskTypes[]) || undefined });
              }}
            />
            <Select
              placeholder={t('filter.status.placeholder')}
              optionList={_.entries(t('status', { returnObjects: true }) as Record<string, string>).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
              multiple
              value={state.statuses}
              onChange={(value) => {
                updateState({ statuses: (value as TaskStatus[]) || undefined });
              }}
            />
          </div>

          <div
            className="p-2 overflow-scroll"
            onScroll={(e) => {
              const { scrollTop, clientHeight, scrollHeight } = e.target;
              if (Math.abs(scrollHeight - (scrollTop + clientHeight)) <= 1) {
                query.fetchNextPage();
              }
            }}
          >
            <Table columns={columns} dataSource={list} pagination={false} empty={t('empty')} />
          </div>
        </main>
      </div>
    ),
    [t, state.indexUids, state.types, state.statuses, columns, list, query]
  );
};

export const Route = createFileRoute('/ins/$insID/_layout/tasks')({
  component: Page,
  pendingComponent: LoaderPage,
  validateSearch: searchSchema,
});
