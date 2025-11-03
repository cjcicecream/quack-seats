import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";

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

const ManagePreferences = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, [classId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("student_preferences")
        .select("*, students(name)")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPreferences(data || []);
    } catch (error: any) {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🥔Student Preferences🥔
        </h1>

        {preferences.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No student preferences submitted yet
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {preferences.map((pref) => (
              <Card key={pref.id} className="shadow-[var(--shadow-glow)]">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{pref.students.name}</CardTitle>
                      <CardDescription>
                        {pref.status === "approved" && (
                          <Badge className="bg-green-500">Approved</Badge>
                        )}
                        {pref.status === "declined" && (
                          <Badge variant="destructive">Declined</Badge>
                        )}
                        {pref.status === "pending" && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
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
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Preferences:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {Array.isArray(pref.preferences) ? (
                        pref.preferences.map((p: any, i: number) => (
                          <li key={i} className="text-muted-foreground">
                            {typeof p === 'string' ? p : p.name || 'Unknown'}
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">
                          {typeof pref.preferences === 'string' ? pref.preferences : JSON.stringify(pref.preferences)}
                        </li>
                      )}
                    </ol>
                  </div>
                  {pref.additional_comments && (
                    <div>
                      <h4 className="font-semibold mb-2">Additional Comments:</h4>
                      <p className="text-muted-foreground italic">
                        "{pref.additional_comments}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePreferences;
