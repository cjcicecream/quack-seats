import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import DuckAvatar from "@/components/DuckAvatar";
import { RefreshCw, Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Arrangement {
  id: string;
  arrangement: any;
  created_at: string;
}

interface StudentPreference {
  student_id: string;
  preferences: any;
  students: { name: string };
}

const SeatingChart = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [currentArrangement, setCurrentArrangement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentPreferences, setStudentPreferences] = useState<StudentPreference[]>([]);

  useEffect(() => {
    loadArrangements();
    loadPreferences();
  }, [classId]);

  const loadArrangements = async () => {
    try {
      const { data, error } = await supabase
        .from("seating_arrangements")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setArrangements(data || []);
      if (data && data.length > 0) {
        setCurrentArrangement(data[0].arrangement);
      }
    } catch (error: any) {
      toast.error("Failed to load seating arrangements");
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("student_preferences")
        .select("student_id, preferences, students(name)")
        .eq("class_id", classId);

      if (error) throw error;
      setStudentPreferences(data || []);
    } catch (error: any) {
      console.error("Failed to load preferences:", error);
    }
  };

  // Calculate preference satisfaction percentage
  const preferenceStats = useMemo(() => {
    if (!currentArrangement?.tables || studentPreferences.length === 0) {
      return { percentage: 0, satisfied: 0, total: 0 };
    }

    // Build a map of student name -> table index
    const studentTableMap: Record<string, number> = {};
    currentArrangement.tables.forEach((table: any, tableIndex: number) => {
      table.seats?.forEach((seat: any) => {
        if (seat.student?.name) {
          studentTableMap[seat.student.name.toLowerCase()] = tableIndex;
        }
      });
    });

    let totalPreferences = 0;
    let satisfiedPreferences = 0;

    studentPreferences.forEach((pref) => {
      const studentName = pref.students?.name?.toLowerCase();
      const studentTable = studentTableMap[studentName];
      
      if (studentTable === undefined) return;

      // Get preference array (handle both formats)
      const prefArray = Array.isArray(pref.preferences) 
        ? pref.preferences 
        : pref.preferences?.students;

      if (!Array.isArray(prefArray)) return;

      prefArray.forEach((p: any) => {
        const prefName = (typeof p === 'string' ? p : p.name)?.toLowerCase();
        if (!prefName) return;
        
        totalPreferences++;
        const prefTable = studentTableMap[prefName];
        if (prefTable === studentTable) {
          satisfiedPreferences++;
        }
      });
    });

    const percentage = totalPreferences > 0 
      ? Math.round((satisfiedPreferences / totalPreferences) * 100) 
      : 0;

    return { percentage, satisfied: satisfiedPreferences, total: totalPreferences };
  }, [currentArrangement, studentPreferences]);

  const generateNewArrangement = async () => {
    setLoading(true);
    try {
      const { data: layout } = await supabase
        .from("table_layouts")
        .select("*")
        .eq("class_id", classId)
        .eq("is_active", true)
        .maybeSingle();

      if (!layout) {
        toast.error("Please set up table layout first");
        setLoading(false);
        return;
      }

      let studentsToUse: any[] = [];

      // If there's an existing arrangement, use the same students
      if (currentArrangement && currentArrangement.tables) {
        // Extract students from the previous arrangement
        currentArrangement.tables.forEach((table: any) => {
          if (table.seats) {
            table.seats.forEach((seat: any) => {
              if (seat.student) {
                studentsToUse.push(seat.student);
              }
            });
          }
        });
      }

      // If no previous arrangement or no students found, fetch from database
      if (studentsToUse.length === 0) {
        const { data: students } = await supabase
          .from("students")
          .select("*")
          .eq("class_id", classId);

        if (!students || students.length === 0) {
          toast.error("Please add students first");
          setLoading(false);
          return;
        }
        studentsToUse = students;
      }

      // Shuffle the students for a new random arrangement
      const shuffled = [...studentsToUse].sort(() => Math.random() - 0.5);
      const layoutData = layout.layout as any;
      const tables = layoutData.tables || [];
      
      let studentIndex = 0;
      const arrangement = {
        tables: tables.map((table: any) => ({
          ...table,
          seats: table.seats.map((seat: any) => {
            const student = shuffled[studentIndex] || null;
            if (student) studentIndex++;
            return {
              ...seat,
              student,
            };
          }),
        })),
      };

      const { error } = await supabase
        .from("seating_arrangements")
        .insert({
          class_id: classId,
          arrangement,
        });

      if (error) throw error;
      
      toast.success("New seating arrangement generated!");
      loadArrangements();
    } catch (error: any) {
      toast.error(error.message || "Failed to generate arrangement");
    } finally {
      setLoading(false);
    }
  };

  if (loading && arrangements.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            🥔View Charts🥔
          </h1>
          <Button variant="playful" onClick={generateNewArrangement} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate New
          </Button>
        </div>

        {currentArrangement ? (
          <Card className="p-8 shadow-[var(--shadow-glow)]">
            <div className="grid gap-8">
              {currentArrangement.tables?.map((table: any, tableIndex: number) => (
                <div
                  key={tableIndex}
                  className="border-2 border-primary/30 rounded-lg p-6 bg-card/50"
                >
                  <h3 className="text-lg font-semibold mb-4">Table {tableIndex + 1}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {table.seats?.map((seat: any, seatIndex: number) => (
                      <div key={seatIndex} className="flex justify-center">
                        {seat.student ? (
                          <DuckAvatar name={seat.student.name} size="md" />
                        ) : (
                          <div className="w-16 h-20 border-2 border-dashed border-muted-foreground/30 bg-muted/20 rounded-lg flex items-center justify-center text-3xl opacity-50">
                            🥔
                          </div>
                        )}
                      </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Preference satisfaction stats */}
        {preferenceStats.total > 0 && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-pink-500" />
              <span className="font-semibold">Preferences Met</span>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={preferenceStats.percentage} className="flex-1 h-3" />
              <span className="text-lg font-bold min-w-[60px] text-right">
                {preferenceStats.percentage}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {preferenceStats.satisfied} of {preferenceStats.total} student preferences satisfied
            </p>
          </div>
        )}
      </Card>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">
              No seating arrangement yet
            </p>
            <Button variant="playful" onClick={generateNewArrangement}>
              Generate First Arrangement
            </Button>
          </Card>
        )}

        {arrangements.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">All Arrangements</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {arrangements.map((arr, index) => (
                <Card 
                  key={arr.id}
                  className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                    currentArrangement === arr.arrangement 
                      ? 'border-2 border-primary shadow-[var(--shadow-glow)]' 
                      : 'border border-primary/30'
                  }`}
                  onClick={() => setCurrentArrangement(arr.arrangement)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {index === 0 ? '🌟 Latest' : `#${arrangements.length - index}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(arr.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {currentArrangement === arr.arrangement && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Viewing
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingChart;
