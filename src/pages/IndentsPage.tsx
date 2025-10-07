import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import IndentForm from "@/components/IndentForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, Edit } from "lucide-react";
import type { IndentStatus, IndentType } from "@/types/indent";
import { useIndents } from "@/hooks/useIndent";
import { useDebounce } from "@/hooks/useDebounce";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { getRoleIdFromAuth } from "@/lib/utils";
import { ViewDialog } from "@/components/common/ViewDialogBox";

export default function IndentsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState<IndentType | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  // Fetch indents data (debounced by search)
  const { refetch } = useIndents({ page: page, limit: rowsPerPage, search: debouncedSearch });
  const indentState = useSelector((state: RootState) => state.manufacturing.indentResponse);
  const indentData = indentState?.data;
  const indent = indentState?.data?.indents || [];
  const roleId = getRoleIdFromAuth();

  useEffect(() => {
    refetch();
  }, [page, refetch]);

  // Transform data for table
  const transformedIndent = indent ? indent : [];

  // Action handlers
  const handleView = (rowData: any) => {
    setSelectedIndent(rowData);
    setIsViewDialogOpen(true);
  };

  const indentColumns = [
    { key: "indent_no", header: "Indent No", sortable: true },
    { key: "batch_no", header: "Batch No", sortable: true },
    { key: "required_by", header: "Required By", sortable: true, render: (value: any) => new Date(value).toLocaleDateString() },
    { key: "priority", header: "Priority", sortable: true },
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
    { key: "created_at", header: "Date", sortable: true, render: (value: any) => new Date(value).toLocaleDateString() },
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
            onClick={() => { setIsCreateDialogOpen(true), setSelectedIndent(row) }}
            data-testid={`button-edit-${row.originalId}`}
            title="Update Status"
            disabled={roleId !== 1}
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

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setSelectedIndent(null);
            }
          }}
        >
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
            <IndentForm setIsCreateDialogOpen={setIsCreateDialogOpen} selectedIndent={selectedIndent || undefined} />
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

      <ViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        title="View Indent"
        subtitle={selectedIndent?.indent_no}
        children={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="space-y-2 text-sm">
                  <p><strong>Indent Number:</strong> {selectedIndent?.indent_no}</p>
                  <p><strong>Batch Number:</strong> {selectedIndent?.batch_no}</p>
                  <p><strong>Required By:</strong> {selectedIndent?.required_by}</p>
                  <p><strong>Priority:</strong> {selectedIndent?.priority}</p>
                  <p><strong>Status:</strong> {selectedIndent?.status}</p>
                  <p><strong>Notes:</strong> {selectedIndent?.notes}</p>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}