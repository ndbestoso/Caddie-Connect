"use client";

import * as React from "react";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Archive, ArchiveRestore } from "lucide-react";

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export function AnnouncementManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = React.useState<AnnouncementData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = React.useState<AnnouncementData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: "",
    content: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  React.useEffect(() => {
    const announcementsRef = collection(db, "announcements");
    const q = query(announcementsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AnnouncementData[];
        setAnnouncements(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching announcements:", error);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Failed to load announcements",
          description: error.message,
        });
      }
    );

    return unsubscribe;
  }, [toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: formData.title,
        content: formData.content,
        date: new Date(formData.date).toISOString(),
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      });

      toast({
        title: "Announcement created",
        description: "The announcement has been published successfully.",
      });

      setCreateDialogOpen(false);
      setFormData({ title: "", content: "", date: format(new Date(), "yyyy-MM-dd") });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create announcement",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncement) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "announcements", selectedAnnouncement.id), {
        title: formData.title,
        content: formData.content,
        date: new Date(formData.date).toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Announcement updated",
        description: "The announcement has been updated successfully.",
      });

      setEditDialogOpen(false);
      setSelectedAnnouncement(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update announcement",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (announcement: AnnouncementData) => {
    try {
      await updateDoc(doc(db, "announcements", announcement.id), {
        isActive: !announcement.isActive,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: announcement.isActive ? "Announcement archived" : "Announcement restored",
        description: `The announcement has been ${announcement.isActive ? "archived" : "restored"}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update announcement",
        description: error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "announcements", selectedAnnouncement.id));

      toast({
        title: "Announcement deleted",
        description: "The announcement has been permanently deleted.",
      });

      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete announcement",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (announcement: AnnouncementData) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      date: format(new Date(announcement.date), "yyyy-MM-dd"),
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (announcement: AnnouncementData) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Announcement Management</CardTitle>
            <CardDescription className="text-base mt-1.5">
              Create, edit, and manage announcements for all caddies.
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create New Announcement</DialogTitle>
                  <DialogDescription>
                    Create a new announcement that will be visible to all caddies.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Title
                    </label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="content" className="text-sm font-medium">
                      Content
                    </label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={5}
                      required
                    />
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
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Announcement"}
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
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium max-w-md">
                      <div className="truncate">{announcement.title}</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(announcement.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={announcement.isActive ? "default" : "secondary"}>
                        {announcement.isActive ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(announcement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(announcement)}
                        >
                          {announcement.isActive ? (
                            <Archive className="h-4 w-4" />
                          ) : (
                            <ArchiveRestore className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(announcement)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No announcements yet. Create your first announcement.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
              <DialogDescription>
                Make changes to the announcement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-content" className="text-sm font-medium">
                  Content
                </label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-date" className="text-sm font-medium">
                  Date
                </label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this announcement? This action cannot be undone.
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
