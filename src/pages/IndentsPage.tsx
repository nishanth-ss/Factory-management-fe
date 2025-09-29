import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import IndentForm from "@/components/IndentForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, Edit } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { IndentStatus, IndentType } from "@/types/indent";
import { useIndents, useUpdateIndent } from "@/hooks/useIndent";
import { useDebounce } from "@/hooks/useDebounce";
import FormattedDate from "@/lib/formatDate";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export default function IndentsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<IndentType | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  // Fetch indents data (debounced by search)
  const { refetch } = useIndents({ page: page, limit: rowsPerPage, search: debouncedSearch });
  const indentState = useSelector((state: RootState) => state.manufacturing.indentResponse);
  const indentData = indentState?.data;
  const indent = indentState?.data?.indents || [];
  const updateIndent = useUpdateIndent();

  useEffect(() => {
    refetch();
  }, [page, refetch]);

  // Status update mutation
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest('PATCH', `/indents/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      toast({ description: `Status updated to ${variables.status}` });
      queryClient.invalidateQueries({ queryKey: ["indent"] });
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

  function transformIndentData(indents: IndentType[]) {
    return indents.map(indent => {
      return {
        id: indent.id,
        originalId: indent.id,
        indent_no: indent.indent_no,
        materials: indent.items.length > 2
          ? `${indent.items.length} materials requested`
          : indent.items.map((item, i) => (
            <div key={i}>
              Material {i + 1}: {item.raw_material?.name}
            </div>
          )),
        // : indent.items.map((item, i) => `Item ${i + 1}: ${item.qty} units`).join(", "),
        itemCount: indent.items.map((item, i) => <div key={i}>Item {i + 1}: {item.qty} units</div>),
        status: indent.status,
        requested_by_name: indent.requested_by_name,
        created_at: indent.created_at
          ? <FormattedDate date={indent.created_at} />
          : "-",
        fullData: indent
      };
    });
  }


  // Transform data for table
  const transformedIndent = indent ? transformIndentData(indent) : [];

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
    updateIndent.mutate({
      id: selectedIndent?.id || "",
      status: newStatus as string
    });
    setIsEditDialogOpen(false);
    setSelectedIndent(null);
    setNewStatus("");
  };

  const indentColumns = [
    { key: "indent_no", header: "Indent No", sortable: true },
    { key: "materials", header: "Materials", sortable: true },
    { key: "itemCount", header: "Items", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value: any) => {
        return (
          <StatusBadge status={value as IndentStatus} size="sm" />
        )
      }
    },
    { key: "requested_by_name", header: "Requested By", sortable: true, },
    { key: "created_at", header: "Date", sortable: true },
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
            <IndentForm setIsCreateDialogOpen={setIsCreateDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        title="All Indents"
        columns={indentColumns}
        data={transformedIndent || []}
        searchable={true}
        exportable={true}
        pagination={true}
        rowsPerPage={rowsPerPage}
        totalRecords={indentData?.total || 0}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
        search={search}
        onSearch={(term) => {
          setSearch(term);
          setPage(1); 
        }}
      />

      {/* View Indent Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Indent - {selectedIndent?.indent_no}</DialogTitle>
          </DialogHeader>
          {selectedIndent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Basic Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Indent No:</strong> {selectedIndent.indent_no}</p>
                    <p><strong>Status:</strong> <StatusBadge status={selectedIndent.status || "draft"} size="sm" /></p>
                    <p><strong>Requested By:</strong> {selectedIndent.required_by ? <FormattedDate date={selectedIndent.required_by} formatString="dd/MM/yyyy" /> : "N/A"}</p>
                    <p><strong>Submitted:</strong> {selectedIndent.created_at ? new Date(selectedIndent.created_at).toLocaleString('en-IN') : 'Not submitted'}</p>
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
                          <td className="p-3">{item.notes || "Not specified"}</td>
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
            <DialogTitle>Update Status - {selectedIndent?.indent_no}</DialogTitle>
          </DialogHeader>
          {selectedIndent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Current Status: <StatusBadge status={selectedIndent.status || "draft"} size="sm" />
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