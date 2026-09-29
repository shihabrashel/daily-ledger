import { useTranslation } from 'react-i18next';
import { Button, Card, Label } from '@/components/ui';
import { monthLabel } from '@/utils/date';
import type { SavedReport } from '@/storage/models';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { currencyLabel } from '@/utils/currency';
export function ReportCard({ report, busy, share }: { report: SavedReport; busy: boolean; share(uri: string, format: 'pdf' | 'xlsx'): void }) {
  const { t, i18n } = useTranslation();
  return <Card><Label bold>{monthLabel(report.month, i18n.language)}</Label><Label muted>{t(report.closed ? 'closed' : 'snapshot')} · {new Intl.DateTimeFormat(i18n.language === 'bn' ? 'bn-BD' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.createdAt))}</Label>
    <Label muted>{t('currencySettings.label')}: {currencyLabel(report.currency ?? DEFAULT_CURRENCY)}</Label>
    <Button secondary disabled={busy} title={t('sharePdf')} onPress={() => share(report.pdfUri, 'pdf')} />
    <Button secondary disabled={busy} title={t('shareExcel')} onPress={() => share(report.excelUri, 'xlsx')} /></Card>;
}
