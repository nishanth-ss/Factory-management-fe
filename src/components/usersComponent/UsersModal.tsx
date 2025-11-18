"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useCreateUser, useSingleUser, useUpdateUser } from "@/hooks/useUser";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import type { UserType } from "@/types/UsersApiResponse";

const getSchema = (isEdit: boolean) =>
  z
    .object({
      username: z.string().min(1, "Username is required"),
      email: z.string().email("Invalid email"),
      role: z.enum(["superintendent", "storekeeper", "jailor"]),
      password: isEdit
        ? z.string().optional()
        : z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: isEdit
        ? z.string().optional()
        : z.string().min(1, "Confirm Password is required"),
    })
    .refine(
      (data) => {
        if (!isEdit) {
          return data.password === data.confirmPassword;
        }
        return true; // skip validation in edit mode
      },
      {
        path: ["confirmPassword"],
        message: "Passwords must match",
      }
    );

export type FormValues = z.infer<ReturnType<typeof getSchema>>;

export default function CreateUserDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: singleUser }: any = useSingleUser(id as string,{
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      username: "",
      email: "",
      role: "jailor",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(getSchema(!!id)),
  });

  useEffect(() => {
  if (id) {
    setOpen(true);
  }
}, [id]);

  useEffect(() => {
    if (singleUser?.data) {
      reset({
        username: singleUser?.data.name,
        email: singleUser?.data.email,
        role: singleUser?.data.role,
      });
    }else{
      reset({
        username: "",
        email: "",
        role: "jailor",
        password: "",
        confirmPassword: "",
      });
    }

  }, [singleUser?.data,open]);

  const onSubmit = (data: FormValues) => {
    const { confirmPassword, ...payload } = data;
    if (id) {
      const payload: UserType = {
        name: data.username,
        email: data.email,
        role: data.role,
      };
      updateMutation.mutate({
        id: id,
        data: payload,
      }, {
        onSuccess: () => {
          setOpen(false);
          reset();
          setLocation("/users");
        },
      });
    }else{
    createMutation.mutate({
      name: payload.username,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    }, {
      onSuccess: () => {
        setOpen(false);
        reset();
        setLocation("/users");
      },
    });
  }
  };

  const role = watch("role");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setLocation("/users");
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{id ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>Fill in details to {id ? "edit" : "create a new"} user.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input placeholder="Username" {...register("username")} />
            {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
          </div>

          <div>
            <Input type="email" placeholder="Email" {...register("email")} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          <div>
            <Select value={role} onValueChange={(val) => setValue("role", val as "superintendent" | "storekeeper" | "jailor")}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superintendent">Superintendent</SelectItem>
                <SelectItem value="storekeeper">Storekeeper</SelectItem>
                <SelectItem value="jailor">Jailor</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
          </div>

          <div>
            <Input type="password" placeholder="Password" {...register("password")} />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
          </div>

          <div>
            <Input type="password" placeholder="Confirm Password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => {reset(), setOpen(false),setLocation("/users")}}>
              Cancel
            </Button>
            <Button type="submit">{id ? "Update" : "Submit"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
