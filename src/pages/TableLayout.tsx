import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";

interface Table {
  id: number;
  seats: number;
  x: number;
  y: number;
}

const TableLayout = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [newTableSeats, setNewTableSeats] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLayout();
  }, [classId]);

  const loadLayout = async () => {
    try {
      const { data, error } = await supabase
        .from("table_layouts")
        .select("*")
        .eq("class_id", classId)
        .eq("is_active", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        const layoutData = data.layout as any;
        setTables(layoutData.tables || []);
      }
    } catch (error: any) {
      toast.error("Failed to load layout");
    } finally {
      setLoading(false);
    }
  };

  const addTable = () => {
    const newTable: Table = {
      id: Date.now(),
      seats: newTableSeats,
      x: tables.length * 150,
      y: 100,
    };
    setTables([...tables, newTable]);
  };

  const removeTable = (id: number) => {
    setTables(tables.filter((t) => t.id !== id));
  };

  const updateTableSeats = (id: number, seats: number) => {
    setTables(tables.map((t) => (t.id === id ? { ...t, seats } : t)));
  };

  const saveLayout = async () => {
    setLoading(true);
    try {
      // Deactivate old layouts
      await supabase
        .from("table_layouts")
        .update({ is_active: false })
        .eq("class_id", classId);

      // Create new layout with seats array
      const layout = {
        tables: tables.map((table) => ({
          ...table,
          seats: Array.from({ length: table.seats }, (_, i) => ({
            id: i,
            occupied: false,
          })),
        })),
      };

      const { error } = await supabase.from("table_layouts").insert({
        class_id: classId,
        layout,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Layout saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save layout");
    } finally {
      setLoading(false);
    }
  };

  if (loading && tables.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 pb-1 text-center">
          <span className="inline-block">🥔</span>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Table Layout </span>
          <span className="inline-block">🥔</span>
        </h1>

        <div className="grid md:grid-cols-[240px,1fr] gap-4">
          <Card className="h-fit">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base">Add Tables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="seats" className="text-sm whitespace-nowrap">Seats:</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  max="12"
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(parseInt(e.target.value) || 1)}
                  className="h-8 w-16"
                />
                <Button variant="default" size="sm" onClick={addTable}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={saveLayout}
                disabled={loading || tables.length === 0}
              >
                <Save className="mr-1 h-4 w-4" />
                Save
              </Button>
            </CardContent>
          </Card>

          <Card className="p-3">
            {tables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>No tables yet. Add your first table!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {tables.map((table) => (
                  <div 
                    key={table.id} 
                    className="p-2 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium">Table {tables.indexOf(table) + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeTable(table.id)}
                      >
                        ×
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={table.seats}
                        onChange={(e) =>
                          updateTableSeats(table.id, parseInt(e.target.value) || 1)
                        }
                        className="h-6 w-12 text-xs px-1"
                      />
                      <span className="text-xs text-muted-foreground">seats</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: Math.min(table.seats, 8) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full bg-secondary/40 border border-secondary flex items-center justify-center text-xs"
                        >
                          🥔
                        </div>
                      ))}
                      {table.seats > 8 && (
                        <span className="text-xs text-muted-foreground">+{table.seats - 8}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TableLayout;
