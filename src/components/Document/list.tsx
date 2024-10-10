import { useMeiliClient } from '@/hooks/useMeiliClient';
import { showTaskErrorNotification, showTaskSubmitNotification } from '@/utils/text';
import { toast } from '@/utils/toast';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@douyinfe/semi-ui';
import { JSONItem } from './JSONItem';
import { Table, TableProps } from '@arco-design/web-react';
import { GridItem } from './GridItem';
import { Button } from '@arco-design/web-react';

export type Doc = { indexId: string; content: Record<string, unknown>; primaryKey: string };
export type BaseDocItemProps = {
  doc: Doc;
  onClickDocumentUpdate: (doc: Doc) => void;
  onClickDocumentDel: (doc: Doc) => void;
};
export type ListType = 'json' | 'table' | 'grid';

interface Props {
  type?: ListType;
  docs?: Doc[];
  refetchDocs: () => void;
}

export const DocumentList = ({ docs = [], refetchDocs, type = 'json' }: Props) => {
  const { t } = useTranslation('document');
  const client = useMeiliClient();
  const [editingDocument, setEditingDocument] = useState<Doc>();

  const editDocumentMutation = useMutation({
    mutationFn: async ({ indexId, docs }: { indexId: string; docs: object[] }) => {
      return await client.index(indexId).updateDocuments(docs);
    },

    onSuccess: (t) => {
      showTaskSubmitNotification(t);
      refetchDocs();
    },
    onError: (error) => {
      console.error(error);
      showTaskErrorNotification(error);
    },
  });

  const removeDocumentsMutation = useMutation({
    mutationFn: async ({ indexId, docId }: { indexId: string; docId: string[] | number[] }) => {
      return await client.index(indexId).deleteDocuments(docId);
    },

    onSuccess: (t) => {
      showTaskSubmitNotification(t);
      refetchDocs();
    },
    onError: (error: Error) => {
      console.error(error);
      showTaskErrorNotification(error);
    },
  });

  const onClickDocumentDel = useCallback(
    (doc: Doc) => {
      const pk = doc.primaryKey;
      console.debug('onClickDocumentDel', 'pk', pk);
      if (pk) {
        Modal.confirm({
          title: t('delete_document'),
          centered: true,
          content: (
            <p
              dangerouslySetInnerHTML={{
                __html: t('delete.tip', {
                  indexId: doc.indexId,
                  // @ts-ignore
                  primaryKey: doc.content[pk],
                }),
              }}
            ></p>
          ),
          okText: t('confirm'),
          cancelText: t('cancel'),
          onOk: () => {
            // @ts-ignore
            removeDocumentsMutation.mutate({ indexId: doc.indexId, docId: [doc.content[pk]] });
          },
        });
      } else {
        toast.error(t('delete.require_primaryKey', { indexId: doc.indexId }));
      }
    },
    [removeDocumentsMutation, t]
  );

  const onEditDocumentJsonEditorUpdate = useCallback(
    (value: string = '[]') => setEditingDocument((prev) => ({ ...prev!, content: JSON.parse(value) })),
    []
  );

  const onClickDocumentUpdate = useCallback(
    (doc: Doc) => {
      const pk = doc.primaryKey;
      console.debug('onClickDocumentUpdate', 'pk', pk);
      if (pk) {
        Modal.confirm({
          title: t('edit_document'),
          centered: true,
          size: 'large',
          content: (
            <div className={`border rounded-xl p-2`}>
              <MonacoEditor
                language="json"
                className="h-80"
                defaultValue={JSON.stringify(doc?.content ?? {}, null, 2)}
                options={{
                  automaticLayout: true,
                  lineDecorationsWidth: 1,
                }}
                onChange={onEditDocumentJsonEditorUpdate}
              ></MonacoEditor>
            </div>
          ),
          okText: t('submit'),
          cancelText: t('cancel'),
          onOk: () => {
            if (editingDocument) {
              editDocumentMutation.mutate({ indexId: editingDocument.indexId, docs: [editingDocument.content] });
            }
          },
        });
      }
    },
    [editDocumentMutation, editingDocument, onEditDocumentJsonEditorUpdate, t]
  );

  return useMemo(
    () =>
      type === 'table' ? (
        <>
          <Table
            columns={([
              ...new Set(
                docs.reduce(
                  (keys, obj) => {
                    return keys.concat(Object.keys(obj.content));
                  },
                  [docs[0].primaryKey]
                )
              ),
            ].map((i) => ({ title: i, dataIndex: i })) as TableProps['columns'])!.concat([
              {
                title: t('common:actions'),
                fixed: 'right',
                render: (_col, _record, index) => (
                  <div className={`flex items-center gap-2`}>
                    <Button
                      type="secondary"
                      size="mini"
                      status="warning"
                      onClick={() => onClickDocumentUpdate(docs[index])}
                    >
                      {t('common:update')}
                    </Button>
                    <Button
                      type="secondary"
                      size="mini"
                      status="danger"
                      onClick={() => onClickDocumentDel(docs[index])}
                    >
                      {t('common:delete')}
                    </Button>
                  </div>
                ),
              },
            ])}
            data={docs.map((d) => ({ ...d.content }))}
            stripe
            hover
            virtualized
            pagination={false}
            size="small"
          />
        </>
      ) : type === 'grid' ? (
        <div className="grid grid-cols-3 laptop:grid-cols-4 gap-3">
          {docs.map((d, i) => {
            return (
              <GridItem
                doc={d}
                key={i}
                onClickDocumentDel={onClickDocumentDel}
                onClickDocumentUpdate={onClickDocumentUpdate}
              />
            );
          })}
        </div>
      ) : (
        <>
          {docs.map((d, i) => {
            return (
              <JSONItem
                doc={d}
                key={i}
                onClickDocumentDel={onClickDocumentDel}
                onClickDocumentUpdate={onClickDocumentUpdate}
              />
            );
          })}
        </>
      ),
    [docs, onClickDocumentDel, onClickDocumentUpdate, t, type]
  );
};
