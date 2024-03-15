import { modals } from '@mantine/modals';
import { useMeiliClient } from '@/hooks/useMeiliClient';
import { showTaskErrorNotification, showTaskSubmitNotification } from '@/utils/text';
import { toast } from '@/utils/toast';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import ReactJson from 'react-json-view';
import { Button, Modal } from '@mantine/core';
import MonacoEditor from '@monaco-editor/react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

type Doc = { indexId: string; content: object; primaryKey: string };

interface Props {
  docs?: Doc[];
  showIndex?: boolean;
  refetchDocs: () => void;
}

export const DocumentList = ({ docs = [], showIndex = false, refetchDocs }: Props) => {
  const { t } = useTranslation('document');
  const client = useMeiliClient();
  const [isEditDocumentsModalOpen, setIsEditDocumentsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Doc>();

  const editDocumentMutation = useMutation({
    mutationKey: ['editDocument'],
    mutationFn: async ({ indexId, docs }: { indexId: string; docs: object[] }) => {
      return await client.index(indexId).updateDocuments(docs);
    },

    onSuccess: (t) => {
      setIsEditDocumentsModalOpen(false);
      showTaskSubmitNotification(t);
      refetchDocs();
    },
    onError: (error) => {
      console.error(error);
      showTaskErrorNotification(error);
    },
  });

  const removeDocumentsMutation = useMutation({
    mutationKey: ['removeDocuments'],
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
        const modalId = 'deleteDocumentModal';
        modals.open({
          modalId,
          title: t('delete_document'),
          centered: true,
          children: (
            <div className="flex flex-col gap-6">
              <p>
                {t('delete.tip') + ' '}
                <strong>
                  {/* @ts-ignore */}
                  document ({pk}: {doc.content[pk]}) in index {doc.indexId}
                </strong>
                ?
              </p>
              <div className="flex gap-3">
                <button
                  className="btn sm solid danger flex-1"
                  onClick={() => {
                    // @ts-ignore
                    removeDocumentsMutation.mutate({ indexId: doc.indexId, docId: [doc.content[pk]] });
                    modals.close(modalId);
                  }}
                >
                  {t('confirm')}
                </button>
                <button
                  className="btn sm solid bw flex-1"
                  onClick={() => {
                    modals.close(modalId);
                  }}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ),
        });
      } else {
        toast.error(t('delete.require_primaryKey', { indexId: doc.indexId }));
      }
    },
    [removeDocumentsMutation, t]
  );

  const onClickDocumentUpdate = useCallback((doc: Doc) => {
    setIsEditDocumentsModalOpen(true);
    setEditingDocument(doc);
  }, []);

  const onEditDocumentJsonEditorUpdate = useCallback(
    (value: string = '[]') => setEditingDocument((prev) => ({ ...prev!, content: JSON.parse(value) })),
    []
  );

  const list = useMemo(() => {
    return docs.map((d, i) => {
      return (
        <div
          className={`text-xs rounded-xl p-4 bg-primary-100 odd:bg-opacity-20 even:bg-opacity-10 group relative`}
          key={i}
        >
          <div
            className={clsx(`absolute right-3 top-3 opacity-95 badge outline sm bw cornered`, !showIndex && 'hidden')}
          >
            {d.indexId}
          </div>
          <ReactJson
            name={false}
            displayDataTypes={false}
            displayObjectSize={false}
            src={d.content}
            collapsed={3}
            collapseStringsAfterLength={50}
          />
          <div
            className={`absolute right-0 bottom-0 opacity-95 invisible group-hover:visible p-2 flex items-center gap-2`}
          >
            <button className={'btn xs light info'} onClick={() => onClickDocumentUpdate(d)}>
              {t('common:update')}
            </button>
            <button className={'btn xs light danger'} onClick={() => onClickDocumentDel(d)}>
              {t('common:delete')}
            </button>
          </div>
        </div>
      );
    });
  }, [docs, showIndex, onClickDocumentUpdate, onClickDocumentDel, t]);

  const onSubmitDocumentUpdate = useCallback(() => {
    editingDocument &&
      editDocumentMutation.mutate({ indexId: editingDocument.indexId, docs: [editingDocument.content] });
  }, [editDocumentMutation, editingDocument]);

  return useMemo(
    () => (
      <>
        {list}
        <Modal
          opened={isEditDocumentsModalOpen}
          onClose={() => {
            setIsEditDocumentsModalOpen(false);
            setEditingDocument(undefined);
          }}
          centered
          lockScroll
          radius="lg"
          shadow="xl"
          padding="xl"
          size="xl"
          withCloseButton={true}
          title={<p className={`font-bold text-lg`}>{t('edit_document')}</p>}
        >
          <div className={`flex flex-col gap-y-4 w-full`}>
            <div className={`border rounded-xl p-2`}>
              <MonacoEditor
                language="json"
                className="h-80"
                defaultValue={JSON.stringify(editingDocument?.content ?? {}, null, 2)}
                options={{
                  automaticLayout: true,
                  lineDecorationsWidth: 1,
                }}
                onChange={onEditDocumentJsonEditorUpdate}
              ></MonacoEditor>
            </div>
            <Button onClick={onSubmitDocumentUpdate} radius={'xl'} size={'lg'} variant="light">
              {t('submit')}
            </Button>
          </div>
        </Modal>
      </>
    ),
    [editingDocument, t, isEditDocumentsModalOpen, list, onEditDocumentJsonEditorUpdate, onSubmitDocumentUpdate]
  );
};
