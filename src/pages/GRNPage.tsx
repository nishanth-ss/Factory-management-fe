import { useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, Edit } from "lucide-react";
import { formatINR } from "@/lib/currency";
import GRNForm from "@/components/GRNForm";
import { useGrns } from "@/hooks/useGrn";
import FormattedDate from "@/lib/formatDate";
import type { GrnType } from "@/types/grn";
import { ViewDialog } from "@/components/common/ViewDialogBox";

// grnColumns moved inside GRNPage component to access component state

const grnItemColumns = [
  { key: "grnNo", header: "GRN Number", sortable: true },
  { key: "materialCode", header: "Material Code", sortable: true },
  { key: "materialName", header: "Material Name", sortable: true },
  { key: "batchNo", header: "Batch No", sortable: true },
  { 
    key: "qty", 
    header: "Quantity", 
    sortable: true,
    render: (qty: string, row: any) => `${qty} ${row.uom || ''}`
  },
  { 
    key: "costPerUnit", 
    header: "Cost Per Unit", 
    sortable: true,
    render: (cost: string) => cost ? formatINR(cost) : '-'
  },
  { 
    key: "value", 
    header: "Line Value", 
    sortable: true,
    render: (_value: any, row: any) => {
      const qty = parseFloat(row.qty || '0');
      const cost = parseFloat(row.costPerUnit || '0');
      return formatINR(qty * cost);
    }
  },
  { key: "mfgDate", header: "Mfg Date", sortable: true },
  { key: "expDate", header: "Exp Date", sortable: true },
  { key: "location", header: "Location", sortable: true },
];

export default function GRNPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"grns" | "items">("grns");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [search, setSearch] = useState("");
  const [selectedGrn,setSelectedGrn] = useState<GrnType | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const grnColumns = [
    { key: "grn_no", header: "GRN Number", sortable: true },
    { key: "gate_pass_number", header: "Gate Pass Number", sortable: true },
    { key: "purchase_order_id", header: "PO Number", sortable: true },
    { key: "vendor_name", header: "Vendor", sortable: true },
    { key: "received_by_name", header: "Received By", sortable: true },
    { 
      key: "received_at", 
      header: "Received Date", 
      sortable: true,
      render: (date: string) => <FormattedDate date={date} />
    },
    { key: "notes", header: "Remarks", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`} onClick={() => {setSelectedGrn(row), setIsViewDialogOpen(true)}}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" data-testid={`button-edit-${row.id}`} onClick={() => {setSelectedGrn(row), setIsCreateDialogOpen(true)}}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  ];

  const { data: grns = [] } = useGrns({ page, limit:rowsPerPage, search });  

  // For GRN items, we would need to fetch them separately and enrich with material data
  const allGRNItems: any[] = [];

  // function handleUpdateStatus(row: any) {
  //   setSelectedGrn(row);
  //   setNewStatus(row.status);
  //   setIsStatusDialogOpen(true);
  // }

  return (
    <div className="space-y-6" data-testid="page-grn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goods Receipt Notes (GRN)</h1>
          <p className="text-muted-foreground">Manage incoming material receipts and inventory</p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={activeTab === "grns" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("grns")}
              data-testid="tab-grns"
            >
              GRNs
            </Button>
            <Button
              variant={activeTab === "items" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("items")}
              data-testid="tab-items"
            >
              Receipt Items
            </Button>
          </div>
          
          {activeTab === "grns" && (
            <Dialog open={isCreateDialogOpen} onOpenChange={(open)=>{ setIsCreateDialogOpen(open); if(!open){ setSelectedGrn(null); } }}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-grn">
                  <Plus className="h-4 w-4 mr-2" />
                  Create GRN
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New GRN</DialogTitle>
                </DialogHeader>
                <GRNForm 
                  onSubmit={() => {
                    setIsCreateDialogOpen(false);
                  }}
                  setIsCreateDialogOpen={setIsCreateDialogOpen}
                  selectedGrn={selectedGrn}
                  setSelectedGrn={setSelectedGrn}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {activeTab === "grns" && (
        <DataTable 
          title="Goods Receipt Notes"
          columns={grnColumns}
          data={grns?.data ?? []}
          searchable={true}
          exportable={true}
          pagination={true}
          rowsPerPage={rowsPerPage}
          totalRecords={grns?.total || 0}
          currentPage={page}
          onPageChange={(newPage) => setPage(newPage)}
          search={search}
          onSearch={(term) => {
            setSearch(term);
            setPage(1); 
          }}
        />
      )}

      {activeTab === "items" && (
        <DataTable 
          title="GRN Items"
          columns={grnItemColumns}
          data={allGRNItems}
          searchable={true}
          exportable={true}
        />
      )}

      <ViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        title="View GRN"
        subtitle={selectedGrn?.grn_no}
        children={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="space-y-2 text-sm">
                  <p><strong>GRN Number:</strong> {selectedGrn?.grn_no}</p>
                  <p><strong>Gate Pass Number:</strong> {selectedGrn?.gate_pass_number}</p>
                  <p><strong>PO Number:</strong> {selectedGrn?.purchase_order_id}</p>
                  <p><strong>Vendor Name:</strong> {selectedGrn?.vendor_name}</p>
                  <p><strong>Received By Name:</strong> {selectedGrn?.received_by_name}</p>
                  <p><strong>Received At:</strong> {selectedGrn?.received_at ? new Date(selectedGrn.received_at).toLocaleString() : 'Not submitted'}</p>
                  <p><strong>Notes:</strong> {selectedGrn?.notes}</p>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}