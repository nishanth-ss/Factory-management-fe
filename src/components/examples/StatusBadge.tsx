import StatusBadge from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="draft" />
        <StatusBadge status="submitted" />
        <StatusBadge status="approved" />
        <StatusBadge status="rejected" />
        <StatusBadge status="in-progress" />
        <StatusBadge status="completed" />
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="planned" size="sm" />
        <StatusBadge status="qc" size="sm" />
        <StatusBadge status="released" size="sm" />
      </div>
    </div>
  );
}