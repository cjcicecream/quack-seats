import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import { Plus, LayoutGrid, Users, ClipboardList, Copy } from "lucide-react";

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
  const [maxPreferences, setMaxPreferences] = useState(3);
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
      const { data, error } = await supabase
        .from("classes")
        .select("*")
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
      const classCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("classes").insert({
        teacher_id: user.id,
        name: className,
        class_code: classCode,
        max_preferences: maxPreferences,
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
                <div className="space-y-2">
                  <Label htmlFor="maxPreferences">Max Student Preferences</Label>
                  <Input
                    id="maxPreferences"
                    type="number"
                    min="1"
                    max="10"
                    value={maxPreferences}
                    onChange={(e) => setMaxPreferences(parseInt(e.target.value))}
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
              </CardHeader>
              <CardContent className="space-y-2">
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
                  onClick={() => navigate(`/teacher/class/${cls.id}/preferences`)}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Student Preferences
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
