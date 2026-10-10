import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./Layouts/MainLayout";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import CandidateDetail from "./pages/CandidateDetail";
import Imports from "./pages/Imports";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<MainLayout />}>
            <Route index element={<Programs />} />
            <Route path="programs" element={<Programs />} />
            <Route path="imports" element={<Imports />} />
            <Route path="programs/:programId" element={<ProgramDetail />} />
            <Route path="programs/:programId/applications/:applicationId" element={<CandidateDetail />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
