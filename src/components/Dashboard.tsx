import KPICard from "./KPICard";
import DataTable from "./DataTable";
import StatusBadge from "./StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useDashboard } from "@/hooks/useDashboard";
import FormattedDate, { formatRelativeTime } from "@/lib/formatDate";
import { PaginatedNavigation } from "./PaginationNavigation";
import { useState } from "react";
import { useDashboardActivity } from "@/hooks/useDashboard";
import { useDashboardPendingApproval } from "@/hooks/useDashboard";

// Transform API data to table format
// function transformPendingApprovals(data: any) {
//   const indentRows = data.indents.map((indent: any) => ({
//     id: indent.indentNo,
//     originalId: indent.id,
//     type: "Indent",
//     material: indent.items.length > 3 
//       ? `${indent.items.length} materials requested`
//       : indent.items.map((item: any, i: any) => `Item ${i + 1}: ${item.qty} units`).join(", "),
//     amount: `${indent.items.length} items`,
//     requestedBy: indent.requestedByUser.name,
//     status: indent.status,
//     entityType: "indent" as const
//   }));

//   const poRows = data.purchaseOrders.map((po: any) => ({
//     id: po.poNo,
//     originalId: po.id,
//     type: "Purchase Order", 
//     material: po.items.length > 2
//       ? `${po.items.length} materials: ${po.items.slice(0, 2).map((item: any) => item.rawMaterial.name).join(", ")}...`
//       : po.items.map((item: any) => item.rawMaterial.name).join(", "),
//     amount: `₹${parseFloat(po.totalValue || "0").toLocaleString('en-IN')}`,
//     requestedBy: po.createdByUser.name,
//     status: po.status,
//     entityType: "purchaseOrder" as const
//   }));

//   return [...indentRows, ...poRows];
// }


export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();
  const { data: dashboardData } = useDashboard();
  const { data: dashboardActivityData } = useDashboardActivity({ page, limit: 5 });
  const { data: dashboardPendingApprovalData } = useDashboardPendingApproval({ page, limit: 5 });

  // Navigation handlers for quick actions
  const handleCreateIndent = () => setLocation('/indents');
  const handleCreatePO = () => setLocation('/purchase-orders');
  const handleReceiveGRN = () => setLocation('/grn');
  const handleCreateBatch = () => setLocation('/production');

  // const handleApprove = (rowData: any) => {
  //   approveMutation.mutate({
  //     id: rowData.originalId,
  //     entityType: rowData.entityType
  //   });
  // };

  // const handleView = (rowData: any) => {
  //   // TODO: Implement view functionality with modal or navigation
  //   toast({ description: `View ${rowData.type}: ${rowData.id}` });
  // };

  // Transform pending approvals data

  const approvalColumns = [
    { key: "id", header: "ID", sortable: true },
    { key: "type", header: "Type", sortable: true },
    { key: "reference_no", header: "Reference No", sortable: true },
    {
      key: "created_at", header: "Created At", sortable: true,
      render: (createdAt: string) => <FormattedDate date={createdAt} formatString="dd/MM/yyyy" />

    },
    {
      key: "status",
      header: "Status",
      render: (status: string) => <StatusBadge status={status as any} size="sm" />
    },
    // { 
    //   key: "actions", 
    //   header: "Actions",
    //   render: (_: any, rowData: any) => (
    //     <div className="flex gap-1">
    //       <Button 
    //         variant="outline" 
    //         size="sm" 
    //         onClick={() => handleView(rowData)}
    //         data-testid={`button-view-${rowData.originalId}`}
    //       >
    //         <Eye className="h-3 w-3" />
    //       </Button>
    //       <Button 
    //         variant="default" 
    //         size="sm" 
    //         onClick={() => handleApprove(rowData)}
    //         disabled={approveMutation.isPending}
    //         data-testid={`button-approve-${rowData.originalId}`}
    //       >
    //         {approveMutation.isPending ? "..." : "Approve"}
    //       </Button>
    //     </div>
    //   )
    // },
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
          value={dashboardData?.cards[0]?.value}
          subtitle="Awaiting approval"
          icon={Clock}
          trend={{ direction: dashboardData?.cards[0]?.rate?.trend, value: `${dashboardData?.cards[0]?.rate?.change}% from last week` }}
        />
        <KPICard
          title="Active Batches"
          value={dashboardData?.cards[1]?.value}
          subtitle="In production"
          icon={Package}
          trend={{ direction: dashboardData?.cards[1]?.rate?.trend, value: `${dashboardData?.cards[1]?.rate?.change}% from last week` }}
        />
        <KPICard
          title="Low Stock Items"
          value={dashboardData?.cards[2]?.value}
          subtitle="Below reorder level"
          icon={AlertTriangle}
          trend={{ direction: dashboardData?.cards[2]?.rate?.trend, value: `${dashboardData?.cards[2]?.rate?.change}% from last week` }}
        />
        <KPICard
          title="Completed Orders"
          value={dashboardData?.cards[3]?.value}
          subtitle="This month"
          icon={CheckCircle}
          trend={{ direction: dashboardData?.cards[3]?.rate?.trend, value: `${dashboardData?.cards[3]?.rate?.percentageChange}% vs last month` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <DataTable
          title="Pending Approvals"
          columns={approvalColumns}
          data={dashboardPendingApprovalData?.data}
          searchable={false}
          exportable={false}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardActivityData?.data?.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-md hover-elevate">
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(new Date(activity.time))}</span>
                </div>
              ))}


              <PaginatedNavigation page={page} totalPages={dashboardActivityData?.pagination?.totalPages} setPage={setPage} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}