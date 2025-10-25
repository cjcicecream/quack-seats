import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import PotatoAvatar from "@/components/PotatoAvatar";
import { ArrowLeft } from "lucide-react";

const StudentFinalView = () => {
  const navigate = useNavigate();
  const [arrangement, setArrangement] = useState<any>(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStudent();
    loadArrangement();
  }, []);

  const checkStudent = () => {
    const name = sessionStorage.getItem("student_name");
    if (!name) {
      navigate("/student/login");
      return;
    }
    setStudentName(name);
  };

  const loadArrangement = async () => {
    try {
      const classId = sessionStorage.getItem("class_id");
      if (!classId) {
        navigate("/student/login");
        return;
      }

      const { data, error } = await supabase
        .from("seating_arrangements")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setArrangement(data.arrangement);
      }
    } catch (error: any) {
      toast.error("Failed to load seating chart");
    } finally {
      setLoading(false);
    }
  };

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

  const studentLocation = findStudentLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <FloatingBubbles />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/student/preferences")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Update Preferences
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Home
          </Button>
        </div>

        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🐣Final Seating Chart🐣
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

        {arrangement ? (
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
                                <PotatoAvatar name={seat.student.name} size="md" />
                                {isCurrentStudent && (
                                  <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
                                    👈
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-16 h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-3xl">
                                🐥
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
  );
};

export default StudentFinalView;
