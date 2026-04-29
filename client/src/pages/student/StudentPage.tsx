import { SectionCard } from '../../components/SectionCard';

export function StudentPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <SectionCard eyebrow="Student" title="Workshop discovery and registration">
        <p>Frontend scaffold includes router structure for student pages, API client wiring, and a clean base UI.</p>
        <p>Next implementation step: list workshops from `GET /api/workshops`, attach JWT, and submit `Idempotency-Key` during registration.</p>
      </SectionCard>
      <SectionCard eyebrow="Priority" title="Week 1 targets">
        <ul className="list-disc pl-5">
          <li>Workshop list and detail flow</li>
          <li>Registration with QR display</li>
          <li>Auth state with Zustand</li>
        </ul>
      </SectionCard>
    </div>
  );
}

