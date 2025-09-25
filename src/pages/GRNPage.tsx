import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, Edit } from "lucide-react";
import { formatINR } from "@/lib/currency";
import GRNForm from "@/components/GRNForm";

interface GRN {
  id: string;
  grnNo: string;
  purchaseOrderId: string;
  receivedBy: string;
  receivedDate: string;
  remarks?: string;
  createdAt: string;
}

interface GRNItem {
  id: string;
  grnId: string;
  purchaseOrderItemId: string;
  rawMaterialBatchId?: string;
  qty: string;
  costPerUnit?: string;
  batchNo?: string;
  mfgDate?: string;
  expDate?: string;
  location?: string;
}

interface PurchaseOrder {
  id: string;
  poNo: string;
  vendorId: string;
  status: string;
  totalValue: string;
}

interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface RawMaterial {
  id: string;
  materialCode: string;
  materialName: string;
  uom: string;
}

const grnColumns = [
  { key: "grnNo", header: "GRN Number", sortable: true },
  { key: "poNo", header: "PO Number", sortable: true },
  { key: "vendorName", header: "Vendor", sortable: true },
  { key: "receivedByName", header: "Received By", sortable: true },
  { 
    key: "receivedDate", 
    header: "Received Date", 
    sortable: true,
    render: (date: string) => new Date(date).toLocaleDateString('en-IN')
  },
  { key: "remarks", header: "Remarks", sortable: true },
  {
    key: "actions",
    header: "Actions",
    render: (_value: any, row: any) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`}>
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    )
  },
];

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

  const { data: grns = [], isLoading: grnsLoading } = useQuery<GRN[]>({
    queryKey: ["/api/grns"],
  });

  const { data: purchaseOrders = [] } = useQuery<PurchaseOrder[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: materials = [] } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
  });

  // Enrich GRNs with related data
  const enrichedGRNs = grns.map((grn: GRN) => {
    const po = purchaseOrders.find((p: PurchaseOrder) => p.id === grn.purchaseOrderId);
    const vendor = vendors.find((v: Vendor) => v.id === po?.vendorId);
    const user = users.find((u: User) => u.id === grn.receivedBy);
    
    return {
      ...grn,
      poNo: po?.poNo || 'Unknown PO',
      vendorName: vendor?.vendorName || 'Unknown Vendor',
      receivedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown User'
    };
  });

  // For GRN items, we would need to fetch them separately and enrich with material data
  const allGRNItems: any[] = [];

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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
          data={enrichedGRNs}
          searchable={true}
          exportable={true}
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
    </div>
  );
}