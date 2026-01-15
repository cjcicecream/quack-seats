import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import FloatingBubbles from "@/components/FloatingBubbles";
import { CheckCircle, ArrowLeft } from "lucide-react";
const StudentSuccess = () => {
  const navigate = useNavigate();
  const studentData = sessionStorage.getItem("student_data");
  const studentName = studentData ? JSON.parse(studentData).name : "Student";
  return <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/student/home")} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
          <button onClick={() => navigate("/")} className="text-xl font-bold hover:opacity-80 transition-opacity">
            <span className="inline-block">🥔</span>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">potato groups</span>
            <span className="inline-block">🥔</span>
          </button>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
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
            Your teacher will review your preferences and create the seating chart.
            Log back in with the same name and class code to change your preferences.
          </p>
          
          <div className="space-y-2">
            
            
            
          </div>
        </CardContent>
      </Card>
      </div>
    </div>;
};
export default StudentSuccess;