import KPICard from "./KPICard";
import DataTable from "./DataTable";
import StatusBadge from "./StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, CheckCircle, Clock, Plus, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Indent, PurchaseOrder, IndentItem, PurchaseOrderItem, RawMaterial, User, Vendor } from "@shared/schema";

// Types for pending approvals API response
type PendingIndent = Indent & { 
  items: IndentItem[]; 
  requestedByUser: Pick<User, 'id' | 'name' | 'email' | 'role'> 
};

type PendingPurchaseOrder = PurchaseOrder & { 
  items: (PurchaseOrderItem & { rawMaterial: Pick<RawMaterial, 'id' | 'code' | 'name' | 'uom'> })[]; 
  vendor: Pick<Vendor, 'id' | 'name' | 'contactEmail'>; 
  createdByUser: Pick<User, 'id' | 'name' | 'email' | 'role'> 
};

interface PendingApprovalsResponse {
  indents: PendingIndent[];
  purchaseOrders: PendingPurchaseOrder[];
}

// Transform API data to table format
function transformPendingApprovals(data: PendingApprovalsResponse) {
  const indentRows = data.indents.map(indent => ({
    id: indent.indentNo,
    originalId: indent.id,
    type: "Indent",
    material: indent.items.length > 3 
      ? `${indent.items.length} materials requested`
      : indent.items.map((item, i) => `Item ${i + 1}: ${item.qty} units`).join(", "),
    amount: `${indent.items.length} items`,
    requestedBy: indent.requestedByUser.name,
    status: indent.status,
    entityType: "indent" as const
  }));

  const poRows = data.purchaseOrders.map(po => ({
    id: po.poNo,
    originalId: po.id,
    type: "Purchase Order", 
    material: po.items.length > 2
      ? `${po.items.length} materials: ${po.items.slice(0, 2).map(item => item.rawMaterial.name).join(", ")}...`
      : po.items.map(item => item.rawMaterial.name).join(", "),
    amount: `₹${parseFloat(po.totalValue || "0").toLocaleString('en-IN')}`,
    requestedBy: po.createdByUser.name,
    status: po.status,
    entityType: "purchaseOrder" as const
  }));

  return [...indentRows, ...poRows];
}

// TODO: remove mock functionality
const mockRecentActivity = [
  { id: "1", action: "Indent IND-045 submitted", user: "John Doe", time: "2 mins ago", type: "indent" },
  { id: "2", action: "PO PO-789 approved", user: "Jane Smith", time: "15 mins ago", type: "po" },
  { id: "3", action: "Batch B-123 completed QC", user: "Mike Johnson", time: "1 hour ago", type: "batch" },
  { id: "4", action: "GRN GRN-456 received", user: "Sarah Wilson", time: "2 hours ago", type: "grn" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Navigation handlers for quick actions
  const handleCreateIndent = () => setLocation('/indents');
  const handleCreatePO = () => setLocation('/purchase-orders');
  const handleReceiveGRN = () => setLocation('/grn');
  const handleCreateBatch = () => setLocation('/production');

  // Fetch pending approvals
  const { data: pendingApprovalsData, isLoading: approvalsLoading } = useQuery<PendingApprovalsResponse>({
    queryKey: ["/api/pending-approvals"],
  });

  // Approval mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, entityType }: { id: string; entityType: 'indent' | 'purchaseOrder' }) => {
      const endpoint = entityType === 'indent' 
        ? `/api/indents/${id}/approve`
        : `/api/purchase-orders/${id}/approve`;
      return await apiRequest('POST', endpoint);
    },
    onSuccess: () => {
      toast({ description: "Item approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/indents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
    },
    onError: (error: any) => {
      toast({ 
        description: error.message || "Failed to approve item", 
        variant: "destructive" 
      });
    }
  });

  const handleApprove = (rowData: any) => {
    approveMutation.mutate({ 
      id: rowData.originalId, 
      entityType: rowData.entityType 
    });
  };

  const handleView = (rowData: any) => {
    // TODO: Implement view functionality with modal or navigation
    toast({ description: `View ${rowData.type}: ${rowData.id}` });
  };

  // Transform pending approvals data
  const pendingApprovals = pendingApprovalsData ? transformPendingApprovals(pendingApprovalsData) : [];

  const approvalColumns = [
    { key: "id", header: "ID", sortable: true },
    { key: "type", header: "Type", sortable: true },
    { key: "material", header: "Materials", sortable: true },
    { key: "amount", header: "Amount", sortable: true },
    { 
      key: "status", 
      header: "Status", 
      render: (status: string) => <StatusBadge status={status as any} size="sm" />
    },
    { 
      key: "actions", 
      header: "Actions",
      render: (_: any, rowData: any) => (
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleView(rowData)}
            data-testid={`button-view-${rowData.originalId}`}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleApprove(rowData)}
            disabled={approveMutation.isPending}
            data-testid={`button-approve-${rowData.originalId}`}
          >
            {approveMutation.isPending ? "..." : "Approve"}
          </Button>
        </div>
      )
    },
  ];
  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCreateIndent} data-testid="button-create-indent">
              <Plus className="h-4 w-4 mr-2" />
              Create Indent
            </Button>
            <Button variant="outline" onClick={handleCreatePO} data-testid="button-create-po">
              <Plus className="h-4 w-4 mr-2" />
              Create PO
            </Button>
            <Button variant="outline" onClick={handleReceiveGRN} data-testid="button-receive-grn">
              <Plus className="h-4 w-4 mr-2" />
              Receive GRN
            </Button>
            <Button variant="outline" onClick={handleCreateBatch} data-testid="button-create-batch">
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Pending Indents"
          value={23}
          subtitle="Awaiting approval"
          icon={Clock}
          trend={{ direction: "up", value: "+12% from last week" }}
        />
        <KPICard 
          title="Active Batches"
          value={8}
          subtitle="In production"
          icon={Package}
          trend={{ direction: "down", value: "-2 from yesterday" }}
        />
        <KPICard 
          title="Low Stock Items"
          value={15}
          subtitle="Below reorder level"
          icon={AlertTriangle}
          trend={{ direction: "up", value: "+3 new alerts" }}
        />
        <KPICard 
          title="Completed Orders"
          value={142}
          subtitle="This month"
          icon={CheckCircle}
          trend={{ direction: "up", value: "+18% vs last month" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <DataTable 
          title="Pending Approvals"
          columns={approvalColumns}
          data={approvalsLoading ? [] : pendingApprovals}
          searchable={false}
          exportable={false}
          loading={approvalsLoading}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-md hover-elevate">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full" size="sm" data-testid="button-view-all">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}