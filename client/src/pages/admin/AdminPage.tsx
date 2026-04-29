import { SectionCard } from '../../components/SectionCard';

export function AdminPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SectionCard eyebrow="Admin" title="Operational dashboard scaffold">
        <p>Reserved for workshop CRUD, CSV sync controls, and reporting views.</p>
      </SectionCard>
      <SectionCard eyebrow="Backend" title="Expected services">
        <ul className="list-disc pl-5">
          <li>Auth with RBAC guards</li>
          <li>Workshop CRUD endpoints</li>
          <li>Notification and AI summary jobs</li>
        </ul>
      </SectionCard>
    </div>
  );
}

