import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

// Production batch status configuration
const statusConfig = {
  planned: { label: "Planned", color: "bg-blue-500", icon: Clock },
  in_process: { label: "In Process", color: "bg-yellow-500", icon: Package },
  qc: { label: "QC", color: "bg-orange-500", icon: AlertTriangle },
  released: { label: "Released", color: "bg-green-500", icon: CheckCircle },
};

// Mock data for development (TODO: Replace with API calls)
const mockProductionBatches = [
  {
    id: "1",
    batchNo: "PB-2024-001",
    articleSku: "WIDGET-A",
    plannedQty: "1000",
    producedQty: "850",
    status: "in_process",
    startDate: "2024-01-15T08:00:00Z",
    endDate: null,
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "2", 
    batchNo: "PB-2024-002",
    articleSku: "GADGET-B",
    plannedQty: "500",
    producedQty: "500",
    status: "qc",
    startDate: "2024-01-10T08:00:00Z",
    endDate: "2024-01-14T17:00:00Z",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "3",
    batchNo: "PB-2024-003", 
    articleSku: "COMPONENT-C",
    plannedQty: "2000",
    producedQty: "2000",
    status: "released",
    startDate: "2024-01-05T08:00:00Z",
    endDate: "2024-01-12T17:00:00Z",
    createdAt: "2024-01-05T08:00:00Z",
  },
];

// Mock material consumptions for cost calculation
const mockConsumptions = {
  "1": 125000, // ₹1,25,000
  "2": 85000,  // ₹85,000
  "3": 220000, // ₹2,20,000
};

export default function ProductionPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // TODO: Replace with actual API call
  const { data: batches = [] } = useQuery({
    queryKey: ["/api/production-batches", statusFilter, searchTerm],
    queryFn: () => {
      // Simulate API response
      let filtered = mockProductionBatches;
      
      if (statusFilter !== "all") {
        filtered = filtered.filter(batch => batch.status === statusFilter);
      }
      
      if (searchTerm) {
        filtered = filtered.filter(batch => 
          batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.articleSku.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return filtered;
    },
  });

  const columns = [
    { key: "batchNo", header: "Batch No", sortable: true },
    { key: "articleSku", header: "Article SKU", sortable: true },
    { 
      key: "plannedQty", 
      header: "Planned Qty", 
      sortable: true,
      render: (qty: string) => qty ? `${qty} PCS` : "-"
    },
    { 
      key: "producedQty", 
      header: "Produced Qty", 
      sortable: true,
      render: (qty: string, row: any) => {
        const produced = parseFloat(qty || "0");
        const planned = parseFloat(row.plannedQty || "0");
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
      key: "status", 
      header: "Status", 
      render: (status: string) => <StatusBadge status={status as any} size="sm" />
    },
    {
      key: "startDate",
      header: "Start Date",
      sortable: true,
      render: (date: string) => date ? format(new Date(date), "dd/MM/yyyy") : "-"
    },
    {
      key: "cost",
      header: "Material Cost",
      render: (_: any, row: any) => {
        const cost = mockConsumptions[row.id as keyof typeof mockConsumptions];
        return cost ? formatINR(cost) : "-";
      }
    },
    { 
      key: "actions", 
      header: "Actions",
      render: (_: any, row: any) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" data-testid={`button-edit-${row.id}`}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  ];

  // Calculate KPI metrics
  const totalBatches = mockProductionBatches.length;
  const activeBatches = mockProductionBatches.filter(b => 
    b.status === "planned" || b.status === "in_process"
  ).length;
  const completedBatches = mockProductionBatches.filter(b => 
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-batch">
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Production Batch</DialogTitle>
              <DialogDescription>
                Create a new production batch with material consumption planning
              </DialogDescription>
            </DialogHeader>
            <ProductionBatchForm 
              onSuccess={() => setIsCreateDialogOpen(false)}
              onCancel={() => setIsCreateDialogOpen(false)}
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
        data={batches}
        searchable={false}
        exportable={true}
      />
    </div>
  );
}