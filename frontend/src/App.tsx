import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./Layouts/MainLayout";
import Programs from "./pages/Programs";
import Dashboard from "./pages/Dashboard";
import ProgramDetail from "./pages/ProgramDetail";
import CandidateDetail from "./pages/CandidateDetail";

export default function App() {
return (
 <BrowserRouter>
  <Routes>
    <Route path="/app" element={<MainLayout />}>
      <Route index element={<Programs />} />
      <Route path="programs" element={<Programs />} />
      <Route path="programs/:programId" element={<ProgramDetail />} />
      <Route path="programs/:programId/candidates/:candidateId" element={<CandidateDetail />} />
      {/* you can put index in dashboar later on if you want */}
      <Route path="dashboard" element={<Dashboard />} />
    </Route>
  </Routes>
</BrowserRouter>   
)  
}
