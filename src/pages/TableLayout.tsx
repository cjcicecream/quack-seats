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
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          🥔Table Layout🥔
        </h1>

        <div className="grid md:grid-cols-[300px,1fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Tables</CardTitle>
              <CardDescription>Configure your classroom layout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seats">Seats per table</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  max="12"
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button variant="playful" className="w-full" onClick={addTable}>
                <Plus className="mr-2 h-4 w-4" />
                Add Table
              </Button>
              <Button
                variant="default"
                className="w-full"
                onClick={saveLayout}
                disabled={loading || tables.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Layout
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              {tables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No tables yet. Add your first table to get started!</p>
                </div>
              ) : (
                tables.map((table) => (
                  <Card key={table.id} className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <h3 className="font-semibold">Table #{tables.indexOf(table) + 1}</h3>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`table-${table.id}`}>Seats:</Label>
                          <Input
                            id={`table-${table.id}`}
                            type="number"
                            min="1"
                            max="12"
                            value={table.seats}
                            onChange={(e) =>
                              updateTableSeats(table.id, parseInt(e.target.value) || 1)
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex gap-2">
                          {Array.from({ length: table.seats }).map((_, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full bg-secondary/40 border-2 border-secondary flex items-center justify-center text-lg"
                            >
                              🥔
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTable(table.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TableLayout;
