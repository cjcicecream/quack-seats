import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import { ArrowLeft } from "lucide-react";

const StudentLogin = () => {
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if student info is already in session
    const studentData = sessionStorage.getItem("student_data");
    if (studentData) {
      navigate("/student/preferences");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!name.trim() || !classCode.trim()) {
        toast.error("Please fill in all fields");
        setLoading(false);
        return;
      }

      // Use server-side edge function for secure student login
      const { data, error } = await supabase.functions.invoke('student-auth', {
        body: {
          action: 'login',
          name: name.trim(),
          classCode: classCode.trim()
        }
      });

      if (error) {
        toast.error("Error connecting to server. Please try again.");
        setLoading(false);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      const { student, hasExistingPreferences } = data;

      // Store student data in session (server-verified)
      sessionStorage.setItem("student_data", JSON.stringify({
        id: student.id,
        name: student.name,
        class_id: student.class_id,
        class_name: student.class_name
      }));

      if (hasExistingPreferences) {
        toast.success(`Welcome back ${student.name}! Edit your preferences below.`);
      } else {
        toast.success(`Welcome ${student.name}!`);
      }
      navigate("/student/preferences");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link 
          to="/"
          className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="h-5 w-5 text-black" />
          <span className="inline-block">🥔</span>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">potato groups</span>
          <span className="inline-block">🥔</span>
        </Link>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingBubbles />
        
        <Card className="w-full max-w-md relative z-10 shadow-[var(--shadow-glow)]">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">
              Student Login
            </CardTitle>
            <CardDescription className="text-lg">
              Student Access - Join your class!
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <p className="text-sm text-muted-foreground">
                Please enter your first name and last initial (e.g., John D)
              </p>
              <Input
                id="name"
                type="text"
                placeholder="e.g., JOHN D"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                required
                className="uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="classCode">Class Code</Label>
              <Input
                id="classCode"
                type="text"
                placeholder="Enter class code from teacher"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                required
                className="uppercase"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              variant="playful" 
              size="lg"
              disabled={loading}
            >
              {loading ? "Joining Class..." : "Join Class"}
            </Button>
          </form>
          
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default StudentLogin;
