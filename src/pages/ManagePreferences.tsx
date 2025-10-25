import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import FloatingBubbles from "@/components/FloatingBubbles";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <FloatingBubbles />

      <div className="max-w-4xl mx-auto relative z-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🐣Student Preferences🐣
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
                    {pref.status === "pending" && (
                      <div className="flex gap-2">
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
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Preferences:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {(pref.preferences as any[]).map((p: any, i: number) => (
                        <li key={i} className="text-muted-foreground">
                          {p.name}
                        </li>
                      ))}
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
