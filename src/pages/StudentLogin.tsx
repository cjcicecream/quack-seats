import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";

const StudentLogin = () => {
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if student info is already in session
    const studentData = sessionStorage.getItem("student_data");
    if (studentData) {
      navigate("/student/home");
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

      // Check if class exists (convert to uppercase to match teacher's code format)
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, name")
        .eq("class_code", classCode.trim().toUpperCase())
        .maybeSingle();

      if (classError) {
        toast.error("Error checking class code. Please try again.");
        setLoading(false);
        return;
      }

      if (!classData) {
        toast.error("Invalid class code. Please check with your teacher.");
        setLoading(false);
        return;
      }

      // Check if student already exists in this class (case-insensitive name match)
      const { data: existingStudents } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", classData.id);

      let studentRecord = existingStudents?.find(
        s => s.name.toLowerCase() === name.trim().toLowerCase()
      );

      // If student doesn't exist, create them
      if (!studentRecord) {
        // Normalize name to Title Case for consistent storage
        const normalizedName = name.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
          
        const { data: newStudent, error: studentError } = await supabase
          .from("students")
          .insert({
            class_id: classData.id,
            name: normalizedName,
            auth_user_id: null
          })
          .select()
          .single();

        if (studentError) throw studentError;
        studentRecord = newStudent;
      }

      // Store student data in session
      sessionStorage.setItem("student_data", JSON.stringify({
        id: studentRecord.id,
        name: studentRecord.name,
        class_id: classData.id,
        class_name: classData.name
      }));

      toast.success(`Welcome ${studentRecord.name}!`);
      navigate("/student/home");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <button 
          onClick={() => navigate("/")}
          className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          🥔potato groups🥔
        </button>
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
                placeholder="e.g., John D"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="classCode">Class Code</Label>
              <Input
                id="classCode"
                type="text"
                placeholder="Enter class code from teacher"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                required
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
          
          <div className="mt-6 text-center">
            <a
              href="/"
              className="block text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to home
            </a>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default StudentLogin;
