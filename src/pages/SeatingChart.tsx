import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import DuckAvatar from "@/components/DuckAvatar";
import { RefreshCw } from "lucide-react";

interface Arrangement {
  id: string;
  arrangement: any;
  created_at: string;
}

const SeatingChart = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [currentArrangement, setCurrentArrangement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArrangements();
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

  const generateNewArrangement = async () => {
    setLoading(true);
    try {
      // This is a simplified auto-generation
      // In production, you'd want a more sophisticated algorithm
      const { data: students } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", classId);

      const { data: layout } = await supabase
        .from("table_layouts")
        .select("*")
        .eq("class_id", classId)
        .eq("is_active", true)
        .single();

      if (!students || !layout) {
        toast.error("Please set up table layout and add students first");
        setLoading(false);
        return;
      }

      // Simple random arrangement
      const shuffled = [...students].sort(() => Math.random() - 0.5);
      const layoutData = layout.layout as any;
      const tables = layoutData.tables || [];
      
      const arrangement = {
        tables: tables.map((table: any, index: number) => ({
          ...table,
          seats: table.seats.map((seat: any, seatIndex: number) => {
            const studentIndex = index * table.seats.length + seatIndex;
            return {
              ...seat,
              student: shuffled[studentIndex] || null,
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
                          <div className="w-16 h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-3xl">
                            🥔
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
