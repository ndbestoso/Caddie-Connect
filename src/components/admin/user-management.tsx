"use client";

import * as React from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit, Shield, User } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'caddie' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchLastName, setSearchLastName] = React.useState("");
  const [newRole, setNewRole] = React.useState<'caddie' | 'admin'>('caddie');

  React.useEffect(() => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserData[];
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Failed to load users",
          description: error.message,
        });
      }
    );

    return unsubscribe;
  }, [toast]);

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    if (selectedUser.id === user?.uid) {
      toast({
        variant: "destructive",
        title: "Cannot change own role",
        description: "You cannot change your own role for security reasons.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Role updated",
        description: `${selectedUser.email} is now ${newRole === 'admin' ? 'an admin' : 'a caddie'}.`,
      });

      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (userData: UserData) => {
    setSelectedUser(userData);
    setNewRole(userData.role);
    setEditDialogOpen(true);
  };

  const filteredUsers = users.filter((userData) =>
    searchLastName ? (userData.lastName || '').toLowerCase().includes(searchLastName.toLowerCase()) : true
  );

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">User Management</CardTitle>
        <CardDescription className="text-base">
          View and manage user accounts and roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by last name..."
          value={searchLastName}
          onChange={(e) => setSearchLastName(e.target.value)}
          className="max-w-sm h-10"
        />
        <div className="border rounded-lg overflow-hidden">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell className="font-medium">
                        {userData.firstName || userData.lastName
                          ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
                          : '—'}
                        {userData.id === user?.uid && (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{userData.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={userData.role === 'admin' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {userData.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              Caddie
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(userData.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(userData)}
                          disabled={userData.id === user?.uid}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {searchLastName
                        ? "No users found for this search."
                        : "No users yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
      </CardContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={newRole} onValueChange={(value: any) => setNewRole(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="caddie" id="role-caddie" />
                <Label htmlFor="role-caddie" className="flex items-center cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Caddie
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="role-admin" />
                <Label htmlFor="role-admin" className="flex items-center cursor-pointer">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={isSubmitting || newRole === selectedUser?.role}
            >
              {isSubmitting ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
