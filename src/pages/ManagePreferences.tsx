import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Trash2, ChevronDown, ChevronUp, Search, Check, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Preference {
  id: string;
  student_id: string;
  preferences: any;
  additional_comments: string | null;
  status: string;
  students: {
    name: string;
  };
}

interface SeatingArrangement {
  id: string;
  arrangement: any;
  created_at: string;
}

const ManagePreferences = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [latestArrangement, setLatestArrangement] = useState<SeatingArrangement | null>(null);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      const [prefsResult, arrangementResult] = await Promise.all([
        supabase
          .from("student_preferences")
          .select("*, students(name)")
          .eq("class_id", classId)
          .order("created_at", { ascending: false }),
        supabase
          .from("seating_arrangements")
          .select("*")
          .eq("class_id", classId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (prefsResult.error) throw prefsResult.error;
      
      // Remove duplicates - keep only the most recent entry per student
      const allPrefs = prefsResult.data || [];
      const seenStudents = new Set<string>();
      const uniquePrefs: Preference[] = [];
      const duplicateIds: string[] = [];
      
      // Since we ordered by created_at desc, first occurrence is the most recent
      allPrefs.forEach((pref) => {
        if (!seenStudents.has(pref.student_id)) {
          seenStudents.add(pref.student_id);
          uniquePrefs.push(pref);
        } else {
          duplicateIds.push(pref.id);
        }
      });
      
      // Delete duplicates from database
      if (duplicateIds.length > 0) {
        await supabase
          .from("student_preferences")
          .delete()
          .in("id", duplicateIds);
        toast.info(`Removed ${duplicateIds.length} duplicate preference(s)`);
      }
      
      setPreferences(uniquePrefs);
      
      if (arrangementResult.data) {
        setLatestArrangement(arrangementResult.data);
      }
    } catch (error: any) {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  // Build a map of student name -> table index from the arrangement
  const studentTableMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!latestArrangement?.arrangement?.tables) return map;
    
    latestArrangement.arrangement.tables.forEach((table: any, tableIndex: number) => {
      table.seats?.forEach((seat: any) => {
        if (seat.student?.name) {
          map[seat.student.name.toLowerCase()] = tableIndex;
        }
      });
    });
    return map;
  }, [latestArrangement]);

  // Check if a specific preference is fulfilled (same table)
  const isPreferenceFulfilled = (studentName: string, preferredName: string): boolean => {
    if (Object.keys(studentTableMap).length === 0) return false;
    
    const studentTable = studentTableMap[studentName.toLowerCase()];
    const preferredTable = studentTableMap[preferredName.toLowerCase()];
    
    if (studentTable === undefined || preferredTable === undefined) return false;
    return studentTable === preferredTable;
  };

  const loadPreferences = async () => {
    loadData();
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("student_preferences")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Preference ${status}`);
      loadPreferences();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const deletePreference = async (id: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}'s preferences?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("student_preferences")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Preference deleted successfully");
      loadPreferences();
    } catch (error: any) {
      toast.error("Failed to delete preference");
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Helper to get preference names from preference object
  const getPreferenceNames = (pref: Preference): string[] => {
    const prefArray = Array.isArray(pref.preferences) 
      ? pref.preferences 
      : pref.preferences?.students;
    
    if (Array.isArray(prefArray)) {
      return prefArray.map((p: any) => 
        typeof p === 'string' ? p : p.name || ''
      ).filter(Boolean);
    }
    return [];
  };

  // Filter preferences based on search query
  const filteredPreferences = (() => {
    if (!searchQuery.trim()) return preferences;

    const query = searchQuery.toLowerCase();
    return preferences.filter((pref) => {
      // Search in student name
      if (pref.students.name.toLowerCase().includes(query)) return true;

      // Search in preference choices
      const prefNames = getPreferenceNames(pref);
      if (prefNames.some((name) => name.toLowerCase().includes(query))) return true;

      return false;
    });
  })();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 pb-1 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🥔 Student Preferences 🥔
        </h1>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or preference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {preferences.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No student preferences submitted yet
            </p>
          </Card>
        ) : filteredPreferences.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No results found for "{searchQuery}"
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPreferences.map((pref) => {
              const isExpanded = expandedIds.has(pref.id);
              const hasComment = !!pref.additional_comments;
              
              return (
                <Card key={pref.id} className="shadow-[var(--shadow-glow)]">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{pref.students.name}</CardTitle>
                          {pref.status === "approved" && (
                            <Badge 
                              className="bg-green-500 cursor-pointer hover:bg-green-600 transition-colors"
                              onClick={() => updateStatus(pref.id, "declined")}
                            >
                              Approved
                            </Badge>
                          )}
                          {pref.status === "declined" && (
                            <Badge 
                              variant="destructive" 
                              className="cursor-pointer hover:bg-destructive/80 transition-colors"
                              onClick={() => updateStatus(pref.id, "approved")}
                            >
                              Declined
                            </Badge>
                          )}
                          {pref.status === "pending" && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                        
                        {/* Full list of preferences */}
                        <CardDescription className="text-sm">
                          {(() => {
                            // Handle both array format and {students: [...]} format
                            const prefArray = Array.isArray(pref.preferences) 
                              ? pref.preferences 
                              : pref.preferences?.students;
                            
                            if (Array.isArray(prefArray) && prefArray.length > 0) {
                              return (
                                <>
                                  Wants to sit with: {" "}
                                  <span className="font-medium">
                                    {prefArray
                                      .map((p: any) => typeof p === 'string' ? p : p.name || 'Unknown')
                                      .join(", ")}
                                  </span>
                                </>
                              );
                            }
                            return "No preferences submitted";
                          })()}
                        </CardDescription>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {pref.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateStatus(pref.id, "approved")}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(pref.id, "declined")}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Decline
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePreference(pref.id, pref.students.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(pref.id)}>
                    <CardContent>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="mr-2 h-4 w-4" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-2 h-4 w-4" />
                              Show Details
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="space-y-4 mt-4">
                        <div>
                          <h4 className="font-semibold mb-2">
                            Preference Status:
                            {Object.keys(studentTableMap).length > 0 && (
                              <span className="text-xs font-normal text-muted-foreground ml-2">
                                (based on latest seating chart)
                              </span>
                            )}
                          </h4>
                          <ol className="list-decimal list-inside space-y-1">
                            {(() => {
                              const prefArray = Array.isArray(pref.preferences) 
                                ? pref.preferences 
                                : pref.preferences?.students;
                              
                              if (Array.isArray(prefArray)) {
                                return prefArray.map((p: any, i: number) => {
                                  const prefName = typeof p === 'string' ? p : p.name || 'Unknown';
                                  const fulfilled = isPreferenceFulfilled(pref.students.name, prefName);
                                  const hasArrangement = Object.keys(studentTableMap).length > 0;
                                  
                                  return (
                                    <li key={i} className="text-muted-foreground flex items-center gap-2">
                                      <span>{prefName}</span>
                                      {hasArrangement && (
                                        fulfilled ? (
                                          <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <X className="h-4 w-4 text-red-400" />
                                        )
                                      )}
                                    </li>
                                  );
                                });
                              }
                              return (
                                <li className="text-muted-foreground">
                                  {typeof pref.preferences === 'string' ? pref.preferences : JSON.stringify(pref.preferences)}
                                </li>
                              );
                            })()}
                          </ol>
                        </div>
                        
                        {hasComment && (
                          <div>
                            <h4 className="font-semibold mb-2">Additional Comments:</h4>
                            <p className="text-muted-foreground italic">
                              "{pref.additional_comments}"
                            </p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </CardContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePreferences;
