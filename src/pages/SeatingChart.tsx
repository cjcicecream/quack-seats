import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import DuckAvatar from "@/components/DuckAvatar";
import { RefreshCw, Heart, Star } from "lucide-react";
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

  // Helper function to calculate preference satisfaction for an arrangement
  const calculateSatisfaction = (arrangement: any, prefs: StudentPreference[]) => {
    if (!arrangement?.tables || prefs.length === 0) {
      return { percentage: 0, satisfied: 0, total: 0 };
    }

    const studentTableMap: Record<string, number> = {};
    arrangement.tables.forEach((table: any, tableIndex: number) => {
      table.seats?.forEach((seat: any) => {
        if (seat.student?.name) {
          studentTableMap[seat.student.name.toLowerCase()] = tableIndex;
        }
      });
    });

    let totalPreferences = 0;
    let satisfiedPreferences = 0;

    prefs.forEach((pref) => {
      const studentName = pref.students?.name?.toLowerCase();
      const studentTable = studentTableMap[studentName];
      
      if (studentTable === undefined) return;

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
  };

  const loadArrangements = async () => {
    try {
      const [arrangementsResult, prefsResult] = await Promise.all([
        supabase
          .from("seating_arrangements")
          .select("*")
          .eq("class_id", classId)
          .order("created_at", { ascending: false }),
        supabase
          .from("student_preferences")
          .select("student_id, preferences, students(name)")
          .eq("class_id", classId)
      ]);

      if (arrangementsResult.error) throw arrangementsResult.error;
      
      const data = arrangementsResult.data || [];
      const prefs = (prefsResult.data || []) as StudentPreference[];
      
      setArrangements(data);
      setStudentPreferences(prefs);
      
      if (data.length > 0) {
        // Find the arrangement with highest preference satisfaction
        let bestArrangement = data[0].arrangement;
        let bestPercentage = -1;
        
        data.forEach((arr) => {
          const stats = calculateSatisfaction(arr.arrangement, prefs);
          if (stats.percentage > bestPercentage) {
            bestPercentage = stats.percentage;
            bestArrangement = arr.arrangement;
          }
        });
        
        setCurrentArrangement(bestArrangement);
      }
    } catch (error: any) {
      toast.error("Failed to load seating arrangements");
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    // Preferences are now loaded together with arrangements
  };

  // Use the helper function for current arrangement stats
  const preferenceStats = useMemo(() => {
    return calculateSatisfaction(currentArrangement, studentPreferences);
  }, [currentArrangement, studentPreferences]);

  // Calculate satisfaction for all arrangements and find the best ones
  const arrangementStats = useMemo(() => {
    const stats = arrangements.map((arr) => ({
      id: arr.id,
      ...calculateSatisfaction(arr.arrangement, studentPreferences)
    }));
    
    // Find the highest percentage
    const maxPercentage = Math.max(...stats.map(s => s.percentage), 0);
    
    return { stats, maxPercentage };
  }, [arrangements, studentPreferences]);

  const getArrangementStars = (arrId: string) => {
    const stat = arrangementStats.stats.find(s => s.id === arrId);
    if (!stat || stat.total === 0 || arrangementStats.maxPercentage === 0) return 0;
    
    // Only show stars for arrangements at the max percentage
    if (stat.percentage === arrangementStats.maxPercentage) {
      return 1; // Single star for best arrangement(s)
    }
    return 0;
  };

  // Smart seating algorithm that prioritizes student preferences
  const optimizeSeating = (students: any[], tables: any[], preferences: StudentPreference[]) => {
    // Build preference graph: studentName -> list of preferred names
    const prefGraph: Record<string, string[]> = {};
    preferences.forEach((pref) => {
      const studentName = pref.students?.name?.toLowerCase();
      if (!studentName) return;
      
      const prefArray = Array.isArray(pref.preferences) 
        ? pref.preferences 
        : pref.preferences?.students;
      
      if (Array.isArray(prefArray)) {
        prefGraph[studentName] = prefArray
          .map((p: any) => (typeof p === 'string' ? p : p.name)?.toLowerCase())
          .filter(Boolean);
      }
    });

    // Calculate affinity score (mutual preferences weighted higher)
    const getAffinity = (s1: string, s2: string): number => {
      let score = 0;
      if (prefGraph[s1]?.includes(s2)) score += 2; // They want to sit with them
      if (prefGraph[s2]?.includes(s1)) score += 2; // Mutual preference bonus
      return score;
    };

    // Build friend clusters based on preferences
    const studentNames = students.map(s => s.name?.toLowerCase());
    const clusters: string[][] = [];
    const assigned = new Set<string>();

    // Sort students by how many preferences they have (prioritize students with preferences)
    const sortedStudents = [...students].sort((a, b) => {
      const aPrefs = prefGraph[a.name?.toLowerCase()]?.length || 0;
      const bPrefs = prefGraph[b.name?.toLowerCase()]?.length || 0;
      return bPrefs - aPrefs;
    });

    // Create clusters starting from students with most preferences
    sortedStudents.forEach(student => {
      const name = student.name?.toLowerCase();
      if (assigned.has(name)) return;

      const cluster = [name];
      assigned.add(name);

      // Add their preferred students to the cluster
      const prefs = prefGraph[name] || [];
      prefs.forEach(prefName => {
        if (!assigned.has(prefName) && studentNames.includes(prefName)) {
          cluster.push(prefName);
          assigned.add(prefName);
        }
      });

      clusters.push(cluster);
    });

    // Add any remaining unassigned students
    students.forEach(s => {
      const name = s.name?.toLowerCase();
      if (!assigned.has(name)) {
        clusters.push([name]);
        assigned.add(name);
      }
    });

    // Get table capacities
    const tableCapacities = tables.map((t: any) => t.seats?.length || 0);
    const tableAssignments: string[][] = tables.map(() => []);

    // Assign clusters to tables, trying to keep clusters together
    const sortedClusters = [...clusters].sort((a, b) => b.length - a.length);
    
    sortedClusters.forEach(cluster => {
      // Find table with most space that can fit as much of the cluster as possible
      let bestTableIdx = 0;
      let bestScore = -1;

      tableAssignments.forEach((table, idx) => {
        const remaining = tableCapacities[idx] - table.length;
        if (remaining <= 0) return;
        
        // Score based on how many cluster members already at this table + space available
        let score = remaining >= cluster.length ? 100 : 0; // Bonus for fitting whole cluster
        cluster.forEach(name => {
          table.forEach(seated => {
            score += getAffinity(name, seated);
          });
        });
        
        if (score > bestScore) {
          bestScore = score;
          bestTableIdx = idx;
        }
      });

      // Add cluster members to the chosen table
      cluster.forEach(name => {
        if (tableAssignments[bestTableIdx].length < tableCapacities[bestTableIdx]) {
          tableAssignments[bestTableIdx].push(name);
        } else {
          // Find another table with space
          for (let i = 0; i < tableAssignments.length; i++) {
            if (tableAssignments[i].length < tableCapacities[i]) {
              tableAssignments[i].push(name);
              break;
            }
          }
        }
      });
    });

    // Convert names back to student objects
    const nameToStudent: Record<string, any> = {};
    students.forEach(s => { nameToStudent[s.name?.toLowerCase()] = s; });

    // Build final arrangement
    return {
      tables: tables.map((table: any, tableIdx: number) => ({
        ...table,
        seats: table.seats.map((seat: any, seatIdx: number) => ({
          ...seat,
          student: nameToStudent[tableAssignments[tableIdx][seatIdx]] || null,
        })),
      })),
    };
  };

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

      // Fetch fresh preferences
      const { data: prefs } = await supabase
        .from("student_preferences")
        .select("student_id, preferences, students(name)")
        .eq("class_id", classId);

      const layoutData = layout.layout as any;
      const tables = layoutData.tables || [];
      
      let arrangement;
      if (prefs && prefs.length > 0) {
        // Generate multiple candidate arrangements and rank them
        const numCandidates = 20; // Generate 20 candidates
        const candidates: { arrangement: any; score: number }[] = [];
        
        for (let i = 0; i < numCandidates; i++) {
          // Shuffle with different randomness each time
          const shuffled = [...studentsToUse].sort(() => Math.random() - 0.5);
          const candidate = optimizeSeating(shuffled, tables, prefs as StudentPreference[]);
          const stats = calculateSatisfaction(candidate, prefs as StudentPreference[]);
          candidates.push({ arrangement: candidate, score: stats.percentage });
        }
        
        // Sort by score descending (best first)
        candidates.sort((a, b) => b.score - a.score);
        
        // Pick the arrangement based on how many already exist
        // First generation = best (index 0), second = second best (index 1), etc.
        const targetIndex = Math.min(arrangements.length, candidates.length - 1);
        arrangement = candidates[targetIndex].arrangement;
        
        const rank = targetIndex + 1;
        const ordinal = rank === 1 ? "best" : rank === 2 ? "2nd best" : rank === 3 ? "3rd best" : `${rank}th best`;
        toast.success(`Generated ${ordinal} arrangement (${candidates[targetIndex].score}% preferences met)`);
      } else {
        // Fallback to random
        const shuffled = [...studentsToUse].sort(() => Math.random() - 0.5);
        let studentIndex = 0;
        arrangement = {
          tables: tables.map((table: any) => ({
            ...table,
            seats: table.seats.map((seat: any) => {
              const student = shuffled[studentIndex] || null;
              if (student) studentIndex++;
              return { ...seat, student };
            }),
          })),
        };
        toast.success("Random seating arrangement generated!");
      }

      const { error } = await supabase
        .from("seating_arrangements")
        .insert({
          class_id: classId,
          arrangement,
        });

      if (error) throw error;
      
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
                      <h3 className="font-semibold text-lg flex items-center gap-1">
                        {index === 0 ? '🌟 Latest' : `#${arrangements.length - index}`}
                        {getArrangementStars(arr.id) > 0 && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 ml-1" />
                        )}
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
                      {arrangementStats.stats.find(s => s.id === arr.id)?.total > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {arrangementStats.stats.find(s => s.id === arr.id)?.percentage}% preferences met
                        </p>
                      )}
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
