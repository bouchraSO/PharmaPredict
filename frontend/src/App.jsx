import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Medicaments from './pages/Medicaments';
import MedicamentDetail from './pages/MedicamentDetail';
import Predictions from './pages/Predictions';
import Recommendations from './pages/Recommendations';
import ModelInfo from './pages/ModelInfo';
import PredictForm from './pages/PredictForm';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/medicaments" element={<Medicaments />} />
          <Route path="/medicaments/:id" element={<MedicamentDetail />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/model" element={<ModelInfo />} />
          <Route path="/predict" element={<PredictForm />} /> 
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}