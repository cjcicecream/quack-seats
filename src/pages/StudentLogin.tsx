import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if class exists
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id")
        .ilike("class_code", classCode.trim())
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

      // Find or create student
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", classData.id)
        .ilike("name", name.trim())
        .maybeSingle();

      let studentId = studentData?.id;

      if (!studentData) {
        const { data: newStudent, error: createError } = await supabase
          .from("students")
          .insert({
            class_id: classData.id,
            name: name.trim(),
          })
          .select("id")
          .single();

        if (createError) throw createError;
        studentId = newStudent.id;
      }

      // Store in sessionStorage
      sessionStorage.setItem("student_id", studentId);
      sessionStorage.setItem("class_id", classData.id);
      sessionStorage.setItem("student_name", name.trim());

      toast.success("Welcome!");
      navigate("/student/preferences");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingBubbles />
      
      <Card className="w-full max-w-md relative z-10 shadow-[var(--shadow-glow)]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            🐣quack groups🐣
          </CardTitle>
          <CardDescription className="text-lg">
            Student Login - Join your class!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="classCode">Class Code</Label>
              <Input
                id="classCode"
                type="text"
                placeholder="Enter class code"
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
              {loading ? "Loading..." : "Join Class"}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/student/final-view")}
            >
              View Final Seating Chart
            </Button>
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
  );
};

export default StudentLogin;
