import DataTable from "@/components/DataTable";
import CreateUserDialog from "@/components/usersComponent/UsersModal";
import { useUsers } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { useLocation } from "wouter";
import DeleteModal from "@/components/usersComponent/DeleteModal";
import { useDeleteUser } from "@/hooks/useUser";
import type { UserType } from "@/types/UsersApiResponse";
import { useDebounce } from "@/hooks/useDebounce";

const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5); // DataTable supports display only; change here if needed
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const { data: usersData }: any = useUsers({ page, limit: rowsPerPage, search: debouncedSearch });
  const deleteUser = useDeleteUser();
  const [open, setOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<UserType | null>(null);
  const [, setLocation] = useLocation();

  const userColumns = [
    { header: "S.NO", key: "sno" },
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Role", key: "role" },
    {
      header: "Actions",
      key: "actions",
      render: (_value: any, row: any) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" data-testid={`button-edit-${row.id}`} onClick={() => { handleEditClick(row); }}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" data-testid={`button-view-${row.id}`} onClick={() => { setDeleteModal(true); setSelectedUserId(row); }}>
            <Trash className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  ];

  const handleEditClick = (row: any) => {
  setSelectedUserId(row.id);
  setLocation(`/users/${row.id}`, { replace: true });
  setOpen(true);
};

  const userRows = Array.isArray(usersData?.data?.response) ? usersData?.data?.response?.map((user: any, index: any) => ({
    sno: (page - 1) * rowsPerPage + index + 1,
    name: user.name,
    email: user.email,
    role: user.role,
    id: user.id,
  })) : [];

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage users and their roles</p>
        </div>
        <Button variant="default" className="h-[1rem]" onClick={() => setOpen(true)}>Create User</Button>
      </div>
      <DataTable
        title="Users Management"
        columns={userColumns}
        data={userRows || []}
        searchable={true}
        exportable={true}
        pagination={true}
        rowsPerPage={rowsPerPage}
        totalRecords={usersData?.data?.total || 0}
        currentPage={page}
        onPageChange={(p) => setPage(p)}
        search={search}
        onSearch={(val) => setSearch(val)}
      />
      <CreateUserDialog open={open} setOpen={setOpen} />
      <DeleteModal open={deleteModal} setOpen={setDeleteModal} handleFunc={() => { deleteUser.mutate({ id: selectedUserId?.id! }, { onSuccess: () => { setDeleteModal(false) } }) }}
      title="Delete User"
      description={`Are you sure you want to delete this ${selectedUserId?.name || selectedUserId?.email}?`}
      />
    </div>
  );
};

export default UsersPage;
