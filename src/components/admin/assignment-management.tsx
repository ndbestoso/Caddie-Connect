"use client";

import * as React from "react";
import { collection, query, where, orderBy, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { type AssignmentData, type UserData, ASSIGNMENT_TYPES, TIME_SLOTS } from "@/lib/types/firestore";

export function AssignmentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = React.useState<AssignmentData[]>([]);
  const [caddies, setCaddies] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedAssignment, setSelectedAssignment] = React.useState<AssignmentData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    caddieId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
    notes: "",
    assignment: "",
  });

  React.useEffect(() => {
    const assignmentsRef = collection(db, "assignments");
    const q = query(assignmentsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AssignmentData[];
        setAssignments(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching assignments:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "caddie"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserData[];
        setCaddies(data);
      },
      (error) => {
        console.error("Error fetching caddies:", error);
      }
    );

    return unsubscribe;
  }, []);

  const getCaddieName = (caddie: UserData) => {
    if (caddie.firstName || caddie.lastName) {
      return `${caddie.firstName || ""} ${caddie.lastName || ""}`.trim();
    }
    return caddie.email;
  };

  // Sort caddies alphabetically by name for the dropdown
  const sortedCaddies = [...caddies].sort((a, b) =>
    getCaddieName(a).toLowerCase().localeCompare(getCaddieName(b).toLowerCase())
  );

  // Returns true if it's past 10pm EST the night before the given date
  const isPastAssignmentCutoff = (dateStr: string) => {
    const now = new Date();
    const estNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const date = new Date(dateStr + "T00:00:00");
    const cutoff = new Date(date);
    cutoff.setDate(cutoff.getDate() - 1);
    cutoff.setHours(22, 0, 0, 0);
    return estNow >= cutoff;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isPastAssignmentCutoff(formData.date)) {
      toast({
        variant: "destructive",
        title: "Assignment window closed",
        description: "Assignments cannot be created after 10pm EST the night before.",
      });
      return;
    }

    const selectedCaddie = caddies.find(c => c.id === formData.caddieId);
    if (!selectedCaddie) {
      toast({
        variant: "destructive",
        title: "No caddie selected",
        description: "Please select a caddie for the assignment.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "assignments"), {
        caddieId: formData.caddieId,
        caddieEmail: selectedCaddie.email,
        date: new Date(formData.date).toISOString(),
        time: formData.time,
        notes: formData.notes,
        ...(formData.assignment ? { assignment: formData.assignment } : {}),
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Assignment created",
        description: `Assignment created for ${getCaddieName(selectedCaddie)}.`,
      });

      setCreateDialogOpen(false);
      setFormData({
        caddieId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "",
        notes: "",
        assignment: "",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create assignment",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "assignments", selectedAssignment.id));

      toast({
        title: "Assignment deleted",
        description: "The assignment has been permanently deleted.",
      });

      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete assignment",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (assignment: AssignmentData) => {
    setSelectedAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Assignment Management</CardTitle>
            <CardDescription className="text-base mt-1.5">
              Create and manage caddie work assignments.
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>
                    Assign a caddie to a specific job.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="caddie" className="text-sm font-medium">
                      Select Caddie
                    </label>
                    <Select value={formData.caddieId} onValueChange={(value) => setFormData({ ...formData, caddieId: value })}>
                      <SelectTrigger id="caddie">
                        <SelectValue placeholder="Select a caddie" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedCaddies.map((caddie) => (
                          <SelectItem key={caddie.id} value={caddie.id}>
                            {getCaddieName(caddie)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-medium">
                      Date
                    </label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      className="cursor-pointer"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="time" className="text-sm font-medium">
                      Arrival Time
                    </label>
                    <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                      <SelectTrigger id="time">
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="assignment-type" className="text-sm font-medium">
                      Assignment Type
                    </label>
                    <Select value={formData.assignment} onValueChange={(value) => setFormData({ ...formData, assignment: value })}>
                      <SelectTrigger id="assignment-type">
                        <SelectValue placeholder="Select type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes
                    </label>
                    <Input
                      id="notes"
                      type="text"
                      placeholder=""
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting || !formData.caddieId}>
                    {isSubmitting ? "Creating..." : "Create Assignment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caddie</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Arrival Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {(() => {
                        const caddie = caddies.find(c => c.id === assignment.caddieId);
                        return caddie ? getCaddieName(caddie) : assignment.caddieEmail;
                      })()}
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.date), "EEE, MMM d")}
                    </TableCell>
                    <TableCell>{assignment.time}</TableCell>
                    <TableCell>{assignment.assignment || "—"}</TableCell>
                    <TableCell>{assignment.notes}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(assignment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No assignments yet. Create your first assignment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
