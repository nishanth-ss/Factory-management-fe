import { useState } from "react";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Eye, Edit, Package, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { format } from "date-fns";
import ProductionBatchForm from "@/components/ProductionBatchForm";
import { useProductions } from "@/hooks/useProduction";
import { useRawMaterialBatches } from "@/hooks/useRawMaterialBatch";
import { ViewDialog } from "@/components/common/ViewDialogBox";
import { getRoleIdFromAuth } from "@/lib/utils";

// Production batch status configuration
const statusConfig = {
  planned: { label: "Planned", color: "bg-blue-500", icon: Clock },
  in_process: { label: "In Process", color: "bg-yellow-500", icon: Package },
  qc: { label: "QC", color: "bg-orange-500", icon: AlertTriangle },
  released: { label: "Released", color: "bg-green-500", icon: CheckCircle },
};

export default function ProductionPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: productions } = useProductions({ page, limit, search: searchTerm });
  const productionsData = productions?.data ?? [];
  const { data: batches } = useRawMaterialBatches({ page: 1, limit: "all", search: "" });
  const batchesData = batches?.data?.[0] ?? [];
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<any>(null);
  const roleId = getRoleIdFromAuth();

const columns = [
    { key: "production_name", header: "Production Name", sortable: true },
    { key: "article_name", header: "Article Name", sortable: true },
    {
      key: "total_ordered_qty",
      header: "Ordered Qty",
      sortable: true,
      render: (qty: string) => qty ? `${qty} PCS` : "-"
    },
    {
      key: "total_produced_qty",
      header: "Produced Qty",
      sortable: true,
      render: (qty: string, row: any) => {
        const produced = parseFloat(qty || "0");
        const ordered = parseFloat(row.total_ordered_qty || "0");
        const percentage = ordered > 0 ? ((produced / ordered) * 100).toFixed(1) : "0";
        return (
          <div className="flex flex-col">
            <span>{produced} {row.unit}</span>
            <span className="text-xs text-muted-foreground">
              {percentage}% of ordered
            </span>
          </div>
        );
      }
    },
    {
      key: "total_dispatched_qty",
      header: "Dispatched Qty",
      sortable: true,
      render: (qty: string) => qty ? `${qty} PCS` : "-"
    },
    {
      key: "remaining_qty",
      header: "Remaining Qty",
      sortable: true,
      render: (qty: string) => qty ? `${qty} PCS` : "-"
    },
    {
      key: "total_cost",
      header: "Total Cost",
      render: (cost: string) => formatINR(cost)
    },
    {
      key: "transit_date",
      header: "Transit Date",
      sortable: true,
      render: (date: string) => date ? format(new Date(date), "dd/MM/yyyy") : "-"
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, row: any) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" data-testid={`button-view-${row.transit_id}`} onClick={() => { setSelectedProduction(row), setIsViewDialogOpen(true) }}>
            <Eye className="h-3 w-3" />
          </Button>
          {/* <Button variant="outline" size="sm" data-testid={`button-edit-${row.transit_id}`}
            disabled={roleId !== 1}
            onClick={() => { setSelectedProduction(row), setIsCreateDialogOpen(true) }}>
            <Edit className="h-3 w-3" />
          </Button> */}
        </div>
      )
    },
  ];

  // Calculate KPI metrics
  // const totalBatches = batches?.total ?? 0;
  // const activeBatches = batchesData.filter(b =>
  //   b.status === "planned" || b.status === "in_process"
  // ).length;
  // const completedBatches = batchesData.filter(b =>
  //   b.status === "released"
  // ).length;

  return (
    <div className="space-y-6" data-testid="production-page">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Production Management</h1>
          <p className="text-muted-foreground">Manage production batches and track material consumption</p>
        </div>
        {/* <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setSelectedProduction(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-batch">
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduction ? "Edit Batch" : "Create Batch"}</DialogTitle>
              <DialogDescription>
                {selectedProduction ? "Edit production batch with material consumption planning" : "Create a new production batch with material consumption planning"}
              </DialogDescription>
            </DialogHeader>
            <ProductionBatchForm
              key={selectedProduction?.id || "new"}
              onCancel={() => { setIsCreateDialogOpen(false), setSelectedProduction(null) }}
              selectedProduction={selectedProduction}
            />
          </DialogContent>
        </Dialog> */}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Units
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchesData?.total_units || 0}</div>
            <p className="text-xs text-muted-foreground">All production units</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active units
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchesData?.active_units || 0}</div>
            <p className="text-xs text-muted-foreground">In progress or planned</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed units
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batchesData?.completed_units || 0}</div>
            <p className="text-xs text-muted-foreground">Released this month</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Material Cost
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(batchesData?.total_cost || 0)}</div>
            <p className="text-xs text-muted-foreground">Total consumption</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_process">In Process</SelectItem>
              <SelectItem value="qc">QC</SelectItem>
              <SelectItem value="released">Released</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by batch number or article SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Batch Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Production Batches Table */}
      <DataTable
        title="Production Units"
        columns={columns}
        data={productionsData}
        exportable={true}
        pagination={true}
        searchable={true}
        totalRecords={productions?.total ?? 0}
        currentPage={productions?.page ?? page}
        rowsPerPage={productions?.limit ?? limit}
        onPageChange={(p) => setPage(p)}
        search={searchTerm}
        onSearch={(term) => {
          setSearchTerm(term);
          setPage(1);
        }}
      />

      {/* View Dialog */}
           <ViewDialog
        open={isViewDialogOpen}
        onOpenChange={() => setIsViewDialogOpen(false)}
        title="Production Details"
        children={<div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <p><span className="font-semibold">Production Name:</span> {selectedProduction?.production_name}</p>
            <p><span className="font-semibold">Article Name:</span> {selectedProduction?.article_name}</p>
            <p><span className="font-semibold">Indent No:</span> {selectedProduction?.indent_no}</p>
            <p><span className="font-semibold">Status:</span> {selectedProduction?.status}</p>
            <p><span className="font-semibold">Transit Date:</span> {selectedProduction?.transit_date ? format(new Date(selectedProduction.transit_date), "dd/MM/yyyy") : "-"}</p>
            <p><span className="font-semibold">Unit:</span> {selectedProduction?.unit}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <p><span className="font-semibold">Total Units:</span> {selectedProduction?.total_units}</p>
            <p><span className="font-semibold">Completed Units:</span> {selectedProduction?.completed_units}</p>
            <p><span className="font-semibold">Active Units:</span> {selectedProduction?.active_units}</p>
            <p><span className="font-semibold">Total Cost:</span> {formatINR(selectedProduction?.total_cost)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <p><span className="font-semibold">Ordered Qty:</span> {selectedProduction?.total_ordered_qty} {selectedProduction?.unit}</p>
            <p><span className="font-semibold">Produced Qty:</span> {selectedProduction?.total_produced_qty} {selectedProduction?.unit}</p>
            <p><span className="font-semibold">Dispatched Qty:</span> {selectedProduction?.total_dispatched_qty} {selectedProduction?.unit}</p>
            <p><span className="font-semibold">Remaining Qty:</span> {selectedProduction?.remaining_qty} {selectedProduction?.unit}</p>
          </div>

          {selectedProduction?.article_remarks && (
            <div className="border-t pt-4">
              <p><span className="font-semibold">Remarks:</span> {selectedProduction.article_remarks}</p>
            </div>
          )}
        </div>}
      />
    </div>
  );
}