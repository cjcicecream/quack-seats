import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import DuckAvatar from "@/components/DuckAvatar";
import FloatingBubbles from "@/components/FloatingBubbles";
import { ArrowLeft, LogOut } from "lucide-react";

const StudentFinalView = () => {
  const [arrangement, setArrangement] = useState<any>(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [canViewSeating, setCanViewSeating] = useState(false);
  const navigate = useNavigate();

  const checkStudent = async () => {
    const studentData = sessionStorage.getItem("student_data");
    
    if (!studentData) {
      toast.error("Please join a class first");
      navigate("/student/login");
      return null;
    }
    
    const student = JSON.parse(studentData);
    setStudentName(student.name);
    return student;
  };

  const loadArrangement = async (classId: string) => {
    try {
      // First check if teacher allows students to view seating
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("show_seating_to_students")
        .eq("id", classId)
        .single();

      if (classError) throw classError;

      const canView = (classData as any)?.show_seating_to_students || false;
      setCanViewSeating(canView);

      // Only fetch arrangement if viewing is allowed
      if (canView) {
        const { data, error } = await supabase
          .from("seating_arrangements")
          .select("arrangement")
          .eq("class_id", classId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setArrangement(data.arrangement as any);
        }
      }
    } catch (error: any) {
      toast.error("Failed to load seating chart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const studentData = await checkStudent();
      if (studentData) {
        await loadArrangement(studentData.class_id);
      }
    };
    init();
  }, []);

  const findStudentLocation = () => {
    if (!arrangement || !studentName) return null;

    const tables = arrangement.tables || [];
    for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
      const table = tables[tableIndex];
      const seats = table.seats || [];
      for (let seatIndex = 0; seatIndex < seats.length; seatIndex++) {
        const seat = seats[seatIndex];
        if (seat.student && seat.student.name.toLowerCase() === studentName.toLowerCase()) {
          return { tableIndex, seatIndex };
        }
      }
    }
    return null;
  };

  const handleLogout = () => {
    sessionStorage.removeItem("student_data");
    toast.success("Logged out successfully");
    navigate("/student/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const studentLocation = findStudentLocation();

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
      
      <div className="flex-1 p-4 md:p-8 relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/student/login")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🥔Final Seating Chart🥔
        </h1>

        {studentLocation && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 shadow-[var(--shadow-glow)]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                Hey {studentName}! 👋
              </h2>
              <p className="text-lg text-muted-foreground">
                You're at <span className="font-bold text-primary">Table {studentLocation.tableIndex + 1}</span>
              </p>
            </div>
          </Card>
        )}

        {!canViewSeating ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">Seating Chart Not Available</h2>
            <p className="text-muted-foreground text-lg mb-4">
              Your teacher hasn't shared the seating chart with the class yet
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later or ask your teacher to enable viewing!
            </p>
          </Card>
        ) : arrangement ? (
          <Card className="p-8 shadow-[var(--shadow-glow)]">
            <div className="grid gap-8">
              {arrangement.tables?.map((table: any, tableIndex: number) => {
                const isStudentTable = studentLocation?.tableIndex === tableIndex;
                
                return (
                  <div
                    key={tableIndex}
                    className={`border-2 rounded-lg p-6 transition-all ${
                      isStudentTable
                        ? "border-primary bg-primary/5 shadow-lg scale-105"
                        : "border-primary/30 bg-card/50"
                    }`}
                  >
                    <h3 className={`text-lg font-semibold mb-4 ${isStudentTable ? "text-primary" : ""}`}>
                      Table {tableIndex + 1} {isStudentTable && "⭐ (Your Table!)"}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {table.seats?.map((seat: any, seatIndex: number) => {
                        const isCurrentStudent =
                          seat.student &&
                          seat.student.name.toLowerCase() === studentName.toLowerCase();

                        return (
                          <div
                            key={seatIndex}
                            className={`flex justify-center transition-all ${
                              isCurrentStudent ? "scale-110" : ""
                            }`}
                          >
                            {seat.student ? (
                              <div className={isCurrentStudent ? "relative" : ""}>
                                <DuckAvatar name={seat.student.name} size="md" />
                                {isCurrentStudent && (
                                  <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
                                    👈
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-16 h-20 border-2 border-dashed border-muted-foreground/30 bg-muted/20 rounded-lg flex items-center justify-center text-3xl opacity-50">
                                🥔
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">
              The teacher hasn't created a seating chart yet
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later to see where you'll be sitting!
            </p>
          </Card>
        )}

        {!studentLocation && arrangement && (
          <Card className="p-6 mt-8 bg-yellow-500/10 border-yellow-500/30">
            <p className="text-center text-yellow-700 dark:text-yellow-300">
              You haven't been assigned a seat yet. Your teacher is still working on the arrangement!
            </p>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
};

export default StudentFinalView;
