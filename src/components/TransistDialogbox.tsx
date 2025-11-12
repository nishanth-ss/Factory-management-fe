import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreateManufactureArticle, useUpdateManufactureArticle, useSingleManufactureArticle } from "@/hooks/useManufactureArticles";
import { useEffect } from "react";

interface TransistDialogboxProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editId?: string | null; // if provided → edit mode
  setSelectedArticle: (article: any) => void;
}

export default function TransistDialogbox({
  open,
  setOpen,
  editId,
  setSelectedArticle,
}: TransistDialogboxProps) {
  const form = useForm({
    defaultValues: {
      article_name: "",
      remarks: "",
    },
  });

  const createMutation = useCreateManufactureArticle();
  const updateMutation = useUpdateManufactureArticle();
  const { data: singleArticle } = useSingleManufactureArticle(editId ?? "", {
    enabled: !!editId,
  });

  // ✅ Load existing data when editing
  useEffect(() => {
    if (singleArticle?.data) {
      form.reset({
        article_name: singleArticle?.data?.article_name,
        remarks: singleArticle?.data?.remarks || "",
      });
    }
  }, [singleArticle, form]);

  // ✅ Handle Submit (Create or Update)
  const onSubmit = async (values: { article_name: string; remarks?: string }) => {
    if (editId) {
      updateMutation.mutate(
        { id: editId, data: values },
        {
          onSuccess: () => {
            setOpen(false);
            setSelectedArticle(null);
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          setSelectedArticle(null);
        },
      });
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedArticle(null);
    form.reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedArticle(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
    
        <DialogTrigger asChild>
          <Button 
            data-testid="button-create-article"
            onClick={() => {
              setSelectedArticle(null);
              form.reset({
                article_name: "",
                remarks: ""
              });
              // Explicitly clear any edit state
              if (editId) {
                setOpen(true);
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Article
          </Button>
        </DialogTrigger>

      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {editId ? "Edit Manufacturing Article" : "Create Manufacturing Article"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Article Name */}
            <FormField
              control={form.control}
              name="article_name"
              rules={{ required: "Article name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Article Name*</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter article name"
                      data-testid="input-article-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter remarks (optional)"
                      data-testid="input-remarks"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel-article"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-article"
              >
                {editId
                  ? updateMutation.isPending
                    ? "Updating..."
                    : "Update Article"
                  : createMutation.isPending
                  ? "Creating..."
                  : "Create Article"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
