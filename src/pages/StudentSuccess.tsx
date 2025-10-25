import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import FloatingBubbles from "@/components/FloatingBubbles";
import { CheckCircle } from "lucide-react";

const StudentSuccess = () => {
  const navigate = useNavigate();
  const studentName = sessionStorage.getItem("student_name");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingBubbles />
      
      <Card className="w-full max-w-md relative z-10 shadow-[var(--shadow-glow)] text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto">
            <CheckCircle className="w-20 h-20 text-primary animate-scale-in" />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            All Set!
          </CardTitle>
          <CardDescription className="text-lg">
            Thanks {studentName}! Your preferences have been submitted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your teacher will review your preferences and create the seating chart soon.
            You can update your preferences anytime by logging in again.
          </p>
          
          <div className="space-y-2">
            <Button
              variant="playful"
              size="lg"
              className="w-full"
              onClick={() => navigate("/student/final-view")}
            >
              View Final Seating Chart
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/student/preferences")}
            >
              Update Preferences
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSuccess;
