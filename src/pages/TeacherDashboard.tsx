import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import { Plus, LayoutGrid, Users, ClipboardList, Copy, Settings, Trash2 } from "lucide-react";

interface Class {
  id: string;
  name: string;
  class_code: string;
  max_preferences: number;
}

const TeacherDashboard = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [className, setClassName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/teacher/auth");
      } else {
        loadClasses();
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/teacher/auth");
      } else if (event === 'SIGNED_IN') {
        loadClasses();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/teacher/auth");
        return;
      }

      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate alphanumeric class code (letters and numbers)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const classCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      // Normalize class name to Title Case
      const normalizedClassName = className.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      const { error } = await supabase.from("classes").insert({
        teacher_id: user.id,
        name: normalizedClassName,
        class_code: classCode,
        max_preferences: 3, // Default value, can be changed in settings
      });

      if (error) throw error;
      
      toast.success(`Class created! Code: ${classCode}`);
      setDialogOpen(false);
      setClassName("");
      loadClasses();
    } catch (error: any) {
      toast.error(error.message || "Failed to create class");
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      toast.success("Class deleted successfully");
      loadClasses();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete class");
    }
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8 relative overflow-hidden">
      <FloatingBubbles />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Classes
          </h1>
        </div>

        <div className="mb-6">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="playful" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create New Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Set up a new class with a unique code for students
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name</Label>
                  <Input
                    id="className"
                    placeholder="e.g., Math Period 3"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="playful" className="w-full">
                  Create Class
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card key={cls.id} className="shadow-[var(--shadow-glow)] hover:scale-105 transition-transform">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{cls.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>Code: <span className="font-mono font-bold text-primary">{cls.class_code}</span></span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(cls.class_code);
                          toast.success("Class code copied to clipboard!");
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{cls.name}" and all associated data including students, preferences, and seating arrangements. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClass(cls.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/teacher/class/${cls.id}/settings`)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Class Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/teacher/class/${cls.id}/layout`)}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Table Layout
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/teacher/class/${cls.id}/manage-prefs`)}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Student Submissions
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(`/teacher/class/${cls.id}/chart`)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  View Charts
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No classes yet. Create your first class to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
