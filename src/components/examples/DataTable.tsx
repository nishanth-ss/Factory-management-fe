import DataTable from '../DataTable';
import StatusBadge from '../StatusBadge';

// TODO: remove mock functionality
const mockIndentData = [
  { id: "IND-001", material: "Steel Sheet", qty: 100, uom: "KG", status: "approved", requestedBy: "John Doe", date: "2024-01-15" },
  { id: "IND-002", material: "Aluminum Rod", qty: 50, uom: "PCS", status: "submitted", requestedBy: "Jane Smith", date: "2024-01-16" },
  { id: "IND-003", material: "Copper Wire", qty: 200, uom: "MTR", status: "draft", requestedBy: "Mike Johnson", date: "2024-01-17" },
  { id: "IND-004", material: "Plastic Resin", qty: 25, uom: "KG", status: "rejected", requestedBy: "Sarah Wilson", date: "2024-01-18" },
];

const indentColumns = [
  { key: "id", header: "Indent ID", sortable: true },
  { key: "material", header: "Raw Material", sortable: true },
  { 
    key: "qty", 
    header: "Quantity", 
    sortable: true,
    render: (qty: number, row: any) => `${qty} ${row.uom}`
  },
  { 
    key: "status", 
    header: "Status", 
    sortable: true,
    render: (status: string) => <StatusBadge status={status as any} size="sm" />
  },
  { key: "requestedBy", header: "Requested By", sortable: true },
  { key: "date", header: "Date", sortable: true },
];

export default function DataTableExample() {
  return (
    <div className="p-4">
      <DataTable 
        title="Indent Register"
        columns={indentColumns}
        data={mockIndentData}
        searchable={true}
        exportable={true}
      />
    </div>
  );
}