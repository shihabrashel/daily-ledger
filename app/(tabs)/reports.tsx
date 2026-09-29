import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Label, Screen } from '@/components/ui';
import { useApp } from '@/storage/AppProvider';
import { Summary } from '@/features/dashboard/Summary';
import { reportService } from '@/features/reports/nativeReports';
import { canClose } from '@/features/reports/closing';
import { ReportCard } from '@/features/reports/ReportCard';
import { monthLabel } from '@/utils/date';
import { userErrorKey, type ErrorKey } from '@/utils/errors';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { currencyLabel } from '@/utils/currency';

export default function Reports() {
  const { ledger, retainReport, closeMonth, settings } = useApp();
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  if (!ledger) return null;
  const month = monthLabel(ledger.activeMonth, i18n.language);
  const prepared = [...ledger.reports].reverse().find(report => report.month === ledger.activeMonth && report.revision === ledger.revision && !report.closed && (report.currency ?? DEFAULT_CURRENCY) === settings.currency);
  const run = async (action: () => Promise<unknown>, fallback: ErrorKey) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try { await action(); }
    catch (error) { Alert.alert(t('errors.title'), t(userErrorKey(error, fallback))); }
    finally { running.current = false; setBusy(false); }
  };
  const share = (uri: string, format: 'pdf' | 'xlsx') => { void run(() => reportService.share(uri, format), 'errors.share'); };
  const generate = () => { void run(async () => {
    setGenerated(false); setGenerating(true);
    try { await reportService.generate(ledger, settings.language, retainReport, settings.currency); setGenerated(true); }
    finally { setGenerating(false); }
  }, 'errors.report'); };
  const startClosing = () => Alert.alert(t('close', { month }), t('closeWarning', { month }), [
    { text: t('cancel'), style: 'cancel' }, { text: t('generate'), onPress: generate },
  ]);
  const finishClosing = () => {
    if (!prepared) return;
    Alert.alert(t('close', { month }), t('finalWarning'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('confirmClose'), style: 'destructive', onPress: () => { void run(() => closeMonth(prepared), 'errors.storage'); } },
    ]);
  };
  return <Screen><Label bold size={30}>{t('reports')}</Label><Label muted>{t('summary', { month })}</Label>
    <Label muted>{t('currencySettings.label')}: {currencyLabel(settings.currency)}</Label>
    <Summary transactions={ledger.transactions} />
    <Button disabled={busy} title={t(generating ? 'generating' : 'generate')} onPress={generate} />
    {generated && <Label bold>{t('reportsGenerated')}</Label>}
    {canClose(ledger.activeMonth) ? <Card><Label>{t('closeWarning', { month })}</Label>
      {prepared ? <><Label bold>{t('exportFirst')}</Label>
        <Button secondary disabled={busy} title={t('sharePdf')} onPress={() => share(prepared.pdfUri, 'pdf')} />
        <Button secondary disabled={busy} title={t('shareExcel')} onPress={() => share(prepared.excelUri, 'xlsx')} />
        <Label bold>{t('closeSecond')}</Label><Button danger disabled={busy} title={t('close', { month })} onPress={finishClosing} /></>
        : <Button disabled={busy} title={t('close', { month })} onPress={startClosing} />}
    </Card> : <Label muted>{t('closeAvailable')}</Label>}
    <Label bold size={22}>{t('retained')}</Label><Label muted>{t('reportHint')}</Label>
    {ledger.reports.length ? [...ledger.reports].reverse().map(report => <ReportCard key={report.id} report={report} busy={busy} share={share} />) : <Card><Label muted>{t('noReports')}</Label></Card>}
  </Screen>;
}
