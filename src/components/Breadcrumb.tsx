import { useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs, BreadcrumbItem } from '@nextui-org/react';

export const DashBreadcrumb = () => {
  const matchRoute = useMatchRoute();
  const { t } = useTranslation();

  const insRoute = matchRoute({ to: '/ins/$insID', fuzzy: true }) as unknown as { insID: string };
  const insKeysRoute = matchRoute({ to: '/ins/$insID/keys', fuzzy: true }) as unknown as { insID: string };
  const insTasksRoute = matchRoute({ to: '/ins/$insID/tasks', fuzzy: true }) as unknown as { insID: string };
  const indexRoute = matchRoute({ to: '/ins/$insID/index/$indexUID', fuzzy: true }) as unknown as { indexUID: string };
  const indexDocsRoute = matchRoute({ to: '/ins/$insID/index/$indexUID/documents', fuzzy: true }) as unknown as {
    indexUID: string;
  };
  const indexSettingRoute = matchRoute({ to: '/ins/$insID/index/$indexUID/setting', fuzzy: true }) as unknown as {
    indexUID: string;
  };

  return (
    <Breadcrumbs color="primary" variant="light">
      <BreadcrumbItem href={import.meta.env.BASE_URL ?? '/'}>🏠</BreadcrumbItem>
      {insRoute && (
        <BreadcrumbItem href={`/ins/${insRoute.insID}`}>{`${t('common:instance')} #${insRoute.insID}`}</BreadcrumbItem>
      )}
      {insKeysRoute && <BreadcrumbItem href={`/ins/${insRoute.insID}/keys`}>{`${t('common:keys')}`}</BreadcrumbItem>}
      {insTasksRoute && <BreadcrumbItem href={`/ins/${insRoute.insID}/tasks`}>{`${t('common:tasks')}`}</BreadcrumbItem>}
      {indexRoute && (
        <BreadcrumbItem
          href={`/ins/${insRoute.insID}/index/${indexRoute.indexUID}`}
        >{`${t('common:indexes')}: ${indexRoute.indexUID}`}</BreadcrumbItem>
      )}
      {indexDocsRoute && (
        <BreadcrumbItem
          href={`/ins/${insRoute.insID}/index/${indexRoute.indexUID}/documents`}
        >{`${t('documents')}`}</BreadcrumbItem>
      )}
      {indexSettingRoute && (
        <BreadcrumbItem
          href={`/ins/${insRoute.insID}/index/${indexRoute.indexUID}/setting`}
        >{`${t('settings')}`}</BreadcrumbItem>
      )}
    </Breadcrumbs>
  );
};
