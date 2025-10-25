import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TeacherAuth from "./pages/TeacherAuth";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentLogin from "./pages/StudentLogin";
import StudentPreferences from "./pages/StudentPreferences";
import StudentSuccess from "./pages/StudentSuccess";
import SeatingChart from "./pages/SeatingChart";
import TableLayout from "./pages/TableLayout";
import ManagePreferences from "./pages/ManagePreferences";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher/auth" element={<TeacherAuth />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/class/:classId/layout" element={<TableLayout />} />
          <Route path="/teacher/class/:classId/preferences" element={<ManagePreferences />} />
          <Route path="/teacher/class/:classId/chart" element={<SeatingChart />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/preferences" element={<StudentPreferences />} />
          <Route path="/student/success" element={<StudentSuccess />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
