import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import { FileEdit, Eye, LogOut } from "lucide-react";

const StudentHome = () => {
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const studentData = sessionStorage.getItem("student_data");
    
    if (!studentData) {
      toast.error("Please login first");
      navigate("/student/login");
      return;
    }
    
    const student = JSON.parse(studentData);
    setStudentName(student.name);
    setClassName(student.class_name);
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("student_data");
    toast.success("Logged out successfully");
    navigate("/student/login");
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="relative z-10 max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome, {studentName}! 👋
            </h1>
            <p className="text-xl text-muted-foreground">
              {className}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 shadow-[var(--shadow-glow)] border-2 border-primary/20 hover:border-primary/40 transition-all hover:scale-105 cursor-pointer"
              onClick={() => navigate("/student/preferences")}
            >
              <div className="text-center space-y-4">
                <FileEdit className="w-16 h-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Submit Preferences</h2>
                <p className="text-muted-foreground">
                  Let your teacher know who you'd like to sit with!
                </p>
                <Button
                  variant="playful"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/student/preferences")}
                >
                  Go to Preferences
                </Button>
              </div>
            </Card>

            <Card className="p-8 shadow-[var(--shadow-glow)] border-2 border-secondary/20 hover:border-secondary/40 transition-all hover:scale-105 cursor-pointer"
              onClick={() => navigate("/student/final-view")}
            >
              <div className="text-center space-y-4">
                <Eye className="w-16 h-16 mx-auto text-secondary" />
                <h2 className="text-2xl font-bold">View Seating Chart</h2>
                <p className="text-muted-foreground">
                  Check out the final seating arrangement!
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/student/final-view")}
                >
                  View Chart
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
