import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Building2, Mail, Phone, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CreateVendor, Vendor } from "@/types/vendor";
import { useCreateVendor, useUpdateVendor, useVendors } from "@/hooks/useVendor";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface VendorWithDetails extends Omit<any, 'address'> {
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
}

const insertVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactEmail: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  gstin: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

type InsertVendor = z.infer<typeof insertVendorSchema>;

function VendorForm({ vendor, setIsCreateOpen }: { vendor?: VendorWithDetails, setIsCreateOpen: (open: boolean) => void }) {

  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const isEdit = !!vendor;


  const form = useForm<InsertVendor>({
    resolver: zodResolver(insertVendorSchema),
    defaultValues: {
      name: vendor?.name || "",
      contactEmail: vendor?.contactEmail || undefined,
      phone: vendor?.phone || undefined,
      gstin: vendor?.gstin || undefined,
      address: {
        street: vendor?.address?.street || "",
        city: vendor?.address?.city || "",
        state: vendor?.address?.state || "",
        pincode: vendor?.address?.pincode || "",
        country: vendor?.address?.country || "",
      },
    },
  });

  const onSubmit = (data: CreateVendor) => {
    if(isEdit){
      updateMutation.mutate({
        id: vendor?.id || "",
        ...data,
      },{
        onSuccess: () => {
          setIsCreateOpen(false);
        }
      });
    }else{
    createMutation.mutate(data,{
      onSuccess: () => {
        setIsCreateOpen(false);
      }
    });
  }
}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter vendor name" 
                  {...field} 
                  data-testid="input-vendor-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="vendor@example.com" 
                  {...field}
                  value={field.value || ""}
                  data-testid="input-vendor-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+91 98765 43210" 
                  {...field}
                  value={field.value || ""}
                  data-testid="input-vendor-phone"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gstin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GSTIN</FormLabel>
              <FormControl>
                <Input 
                  placeholder="22AAAAA0000A1Z5" 
                  {...field}
                  value={field.value || ""}
                  data-testid="input-vendor-gstin"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Address</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123 Industrial Avenue" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-vendor-street"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="India" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-vendor-country"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Mumbai" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-vendor-city"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Maharashtra" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-vendor-state"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="400001" 
                      {...field}
                      value={field.value || ""}
                      data-testid="input-vendor-pincode"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={createMutation.isPending}
          data-testid={`button-${isEdit ? 'update' : 'create'}-vendor`}
        >
          {createMutation.isPending ? "Saving..." : isEdit ? "Update Vendor" : "Create Vendor"}   
        </Button>
      </form>
    </Form>
  );
}

function VendorCard({ vendor }: { vendor: VendorWithDetails }) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (!address || typeof address !== 'object') return 'N/A';
    
    const { street, city, state, pincode, country } = address;
    const parts = [street, city, state, pincode, country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <Card className="hover-elevate" data-testid={`card-vendor-${vendor.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg" data-testid={`text-vendor-name-${vendor.id}`}>
              {vendor.name}
            </CardTitle>
          </div>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                data-testid={`button-edit-vendor-${vendor.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Vendor</DialogTitle>
              </DialogHeader>
              <VendorForm 
                vendor={vendor} 
                setIsCreateOpen={setIsEditOpen}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {vendor.contactEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span data-testid={`text-vendor-email-${vendor.id}`}>{vendor.contactEmail}</span>
          </div>
        )}
        
        {vendor.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span data-testid={`text-vendor-phone-${vendor.id}`}>{vendor.phone}</span>
          </div>
        )}
        
        {vendor.gstin && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono" data-testid={`text-vendor-gstin-${vendor.id}`}>{vendor.gstin}</span>
          </div>
        )}
        
        <div className="flex items-start gap-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="text-muted-foreground" data-testid={`text-vendor-address-${vendor.id}`}>
            {formatAddress(vendor.address)}
          </span>
        </div>
        
        <div className="pt-2">
          <Badge variant="secondary" data-testid={`badge-vendor-status-${vendor.id}`}>
            Active
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { isLoading } = useVendors();
  const state = useSelector((state: RootState) => state.manufacturing.vendorResponse);
  const vendors = Array.isArray(state?.data) ? state.data : [];

  const filteredVendors = vendors?.filter((vendor: Vendor) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Vendors</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="heading-vendors">Vendors</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-vendor">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <VendorForm setIsCreateOpen={setIsCreateOpen}  />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-vendors"
          />
        </div>
        <Badge variant="secondary" data-testid="badge-vendor-count">
          {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No vendors match your search criteria." : "Get started by adding your first vendor."}
            </p>
            {!searchTerm && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Vendor</DialogTitle>
                  </DialogHeader>
                  <VendorForm setIsCreateOpen={setIsCreateOpen}    />
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor: VendorWithDetails) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}