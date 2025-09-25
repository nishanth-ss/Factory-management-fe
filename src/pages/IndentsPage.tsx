import { useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import IndentForm from "@/components/IndentForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, Edit } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Indent, IndentItem, User } from "@shared/schema";

// Define types for API response
type IndentWithItems = Indent & {
  items: IndentItem[];
  requestedByUser: Pick<User, 'id' | 'name' | 'email'>;
};

// Transform API data for table display
function transformIndentData(indents: IndentWithItems[]) {
  return indents.map(indent => ({
    id: indent.indentNo,
    originalId: indent.id, 
    indentNo: indent.indentNo,
    materials: indent.items.length > 2 
      ? `${indent.items.length} materials requested`
      : indent.items.map((item, i) => `Item ${i + 1}: ${item.qty} units`).join(", "),
    itemCount: `${indent.items.length} items`,
    status: indent.status,
    requestedBy: indent.requestedByUser.name,
    submittedAt: indent.submittedAt ? new Date(indent.submittedAt).toLocaleDateString('en-IN') : 'Not submitted',
    fullData: indent // Store complete data for view/edit
  }));
}

export default function IndentsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<IndentWithItems | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();

  // Fetch indents data
  const { data: indents, isLoading } = useQuery<IndentWithItems[]>({
    queryKey: ["/api/indents"],
  });

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest('PATCH', `/api/indents/${id}/status`, { status });
    },
    onSuccess: (data, variables) => {
      toast({ description: `Status updated to ${variables.status}` });
      queryClient.invalidateQueries({ queryKey: ["/api/indents"] });
      setIsEditDialogOpen(false);
      setSelectedIndent(null);
      setNewStatus("");
    },
    onError: (error: any) => {
      toast({ 
        description: error.message || "Failed to update status", 
        variant: "destructive" 
      });
    }
  });

  // Transform data for table
  const transformedIndents = indents ? transformIndentData(indents) : [];

  // Action handlers
  const handleView = (rowData: any) => {
    setSelectedIndent(rowData.fullData);
    setIsViewDialogOpen(true);
  };

  const handleUpdateStatus = (rowData: any) => {
    setSelectedIndent(rowData.fullData);
    setNewStatus(rowData.fullData.status);
    setIsEditDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedIndent && newStatus && newStatus !== selectedIndent.status) {
      statusUpdateMutation.mutate({ 
        id: selectedIndent.id, 
        status: newStatus 
      });
    } else if (newStatus === selectedIndent?.status) {
      toast({ description: "No changes to save" });
    }
  };

  const indentColumns = [
    { key: "indentNo", header: "Indent No", sortable: true },
    { key: "materials", header: "Materials", sortable: true },
    { key: "itemCount", header: "Items", sortable: true },
    { 
      key: "status", 
      header: "Status", 
      sortable: true,
      render: (status: string) => <StatusBadge status={status as any} size="sm" />
    },
    { key: "requestedBy", header: "Requested By", sortable: true },
    { key: "submittedAt", header: "Date", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleView(row)}
            data-testid={`button-view-${row.originalId}`}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleUpdateStatus(row)}
            data-testid={`button-edit-${row.originalId}`}
            title="Update Status"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6" data-testid="page-indents">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Indent Register</h1>
          <p className="text-muted-foreground">Manage material requisition requests</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-indent">
              <Plus className="h-4 w-4 mr-2" />
              Create Indent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Indent</DialogTitle>
            </DialogHeader>
            <IndentForm 
              onSubmit={(data) => {
                console.log("Indent submitted:", data);
                setIsCreateDialogOpen(false);
              }}
              onDraft={(data) => {
                console.log("Indent saved as draft:", data);
                setIsCreateDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable 
        title="All Indents"
        columns={indentColumns}
        data={transformedIndents}
        searchable={true}
        exportable={true}
        loading={isLoading}
      />

      {/* View Indent Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Indent - {selectedIndent?.indentNo}</DialogTitle>
          </DialogHeader>
          {selectedIndent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Basic Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Indent No:</strong> {selectedIndent.indentNo}</p>
                    <p><strong>Status:</strong> <StatusBadge status={selectedIndent.status} size="sm" /></p>
                    <p><strong>Requested By:</strong> {selectedIndent.requestedByUser.name}</p>
                    <p><strong>Submitted:</strong> {selectedIndent.submittedAt ? new Date(selectedIndent.submittedAt).toLocaleString('en-IN') : 'Not submitted'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Items Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Items:</strong> {selectedIndent.items.length}</p>
                    <p><strong>Total Quantity:</strong> {selectedIndent.items.reduce((sum, item) => sum + item.qty, 0)} units</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Requested Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Item</th>
                        <th className="text-left p-3">Quantity</th>
                        <th className="text-left p-3">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIndent.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">Item {index + 1}</td>
                          <td className="p-3">{item.qty} units</td>
                          <td className="p-3">{item.purpose || "Not specified"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status - {selectedIndent?.indentNo}</DialogTitle>
          </DialogHeader>
          {selectedIndent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Current Status: <StatusBadge status={selectedIndent.status} size="sm" />
                </p>
                <div>
                  <label htmlFor="status" className="text-sm font-medium">
                    New Status
                  </label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={statusUpdateMutation.isPending}
                  data-testid="button-cancel-status"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={statusUpdateMutation.isPending || newStatus === selectedIndent.status}
                  data-testid="button-save-status"
                >
                  {statusUpdateMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}