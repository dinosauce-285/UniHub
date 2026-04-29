import { SectionCard } from '../../components/SectionCard';
import { useOfflineSync } from '../../hooks/useOfflineSync';

export function CheckinPage() {
  const { isOnline } = useOfflineSync();

  return (
    <SectionCard eyebrow="Check-in PWA" title="Offline-capable check-in flow">
      <p>
        Current network state:{' '}
        <span className={isOnline ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </p>
      <p>Next implementation step: add QR scanner and IndexedDB queue, then batch sync to `POST /api/checkin/sync` when the connection returns.</p>
    </SectionCard>
  );
}

