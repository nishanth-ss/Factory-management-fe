import { useState } from "react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
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

// Mock material consumptions for cost calculation
const mockConsumptions = {
  "1": 125000, // ₹1,25,000
  "2": 85000,  // ₹85,000
  "3": 220000, // ₹2,20,000
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
  const batchesData = batches?.data ?? [];
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<any>(null);
  const roleId = getRoleIdFromAuth();


  const columns = [
    { key: "batch_no", header: "Batch No", sortable: true },
    { key: "article_sku", header: "Article SKU", sortable: true },
    {
      key: "planned_qty",
      header: "Planned Qty",
      sortable: true,
      render: (qty: string) => qty ? `${qty} PCS` : "-"
    },
    {
      key: "produced_qty",
      header: "Produced Qty",
      sortable: true,
      render: (qty: string, row: any) => {
        const produced = parseFloat(qty || "0");
        const planned = parseFloat(row.planned_qty || "0");
        const percentage = planned > 0 ? ((produced / planned) * 100).toFixed(1) : "0";
        return (
          <div className="flex flex-col">
            <span>{produced} PCS</span>
            <span className="text-xs text-muted-foreground">
              {percentage}% of planned
            </span>
          </div>
        );
      }
    },
    {
      key: "total_batch_cost",
      header: "Material Cost",
      // render: (_: any, row: any) => (
      //   <div>
      //     {row.batch_consumptions?.map((consumption: any) => (
      //       <div key={consumption.id}>
      //         {consumption.cost || 0}
      //       </div>
      //     ))}
      //   </div>
      // )
    },
    {
      key: "batch_status",
      header: "Status",
      render: (status: string) => <StatusBadge status={status as any} size="sm" />
    },
    {
      key: "batch_start_date",
      header: "Start Date",
      sortable: true,
      render: (date: string) => date ? format(new Date(date), "dd/MM/yyyy") : "-"
    },
    {
      key: "batch_end_date",
      header: "End Date",
      sortable: true,
      render: (date: string) => date ? format(new Date(date), "dd/MM/yyyy") : "-"
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, row: any) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`} onClick={() => { setSelectedProduction(row), setIsViewDialogOpen(true) }}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" data-testid={`button-edit-${row.id}`}
            disabled={roleId !== 1}
            onClick={() => { setSelectedProduction(row), setIsCreateDialogOpen(true) }}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  ];

  // Calculate KPI metrics
  const totalBatches = batches?.total ?? 0;
  const activeBatches = batchesData.filter(b =>
    b.status === "planned" || b.status === "in_process"
  ).length;
  const completedBatches = batchesData.filter(b =>
    b.status === "released"
  ).length;
  const totalCost = Object.values(mockConsumptions).reduce((sum, cost) => sum + cost, 0);

  return (
    <div className="space-y-6" data-testid="production-page">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Production Management</h1>
          <p className="text-muted-foreground">Manage production batches and track material consumption</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={() => {setIsCreateDialogOpen(!isCreateDialogOpen),setSelectedProduction(null)}}>
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
              onCancel={() => {setIsCreateDialogOpen(false),setSelectedProduction(null)}}
              selectedProduction={selectedProduction}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Batches
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
            <p className="text-xs text-muted-foreground">All production batches</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Batches
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBatches}</div>
            <p className="text-xs text-muted-foreground">In progress or planned</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Batches
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedBatches}</div>
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
            <div className="text-2xl font-bold">{formatINR(totalCost)}</div>
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
        title="Production Batches"
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
        title="Production Batch"
        children={<div>
          <p>Batch Number: {selectedProduction?.batch_no}</p>
          <p>Article SKU: {selectedProduction?.article_sku}</p>
          <p>Planned Quantity: {selectedProduction?.planned_quantity}</p>
          <p>Status: {selectedProduction?.batch_status}</p>
          <p>Start Date: {new Date(selectedProduction?.batch_start_date).toLocaleDateString()}</p>
          <p>End Date: {new Date(selectedProduction?.batch_end_date).toLocaleDateString()}</p>
          <p>Material Cost : {selectedProduction?.total_batch_cost}</p>
          <p>
            <h1 className="font-bold py-2">Batch Consumption</h1>
            <div>
              {selectedProduction?.batch_consumptions?.map((consumption: any, index: any) => (
                <div key={index} className="py-2">
                  <p className="font-bold">{index + 1}st batch</p>
                  <p>Material Name: {consumption?.raw_material?.name}</p>
                  <p>Quantity: {consumption?.qty_consumed}</p>
                  <p>Cost per Unit: {consumption?.cost_per_unit}</p>
                  <p>Total Cost: {consumption?.total_cost}</p>
                </div>
              ))}
            </div>
          </p>
          <p>
            <h1 className="font-bold py-2">Operation Expenses</h1>
            <div>
              {selectedProduction?.operation_expenses?.map((expense: any, index: any) => (
                <div key={index} className="py-2">
                  <p className="font-bold">{index + 1}st expense</p>
                  <p>Expense Type: {expense?.expense_type}</p>
                  <p>Amount: {expense?.amount}</p>
                  <p>Expense Date: {new Date(expense?.expense_date).toLocaleDateString()}</p>
                  <p>Remarks: {expense?.remarks}</p>
                </div>
              ))}
            </div>
          </p>
        </div>}
      />
    </div>
  );
}