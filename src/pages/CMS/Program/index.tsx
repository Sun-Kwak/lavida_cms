import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProgramManagement from './ProgramManagement';
import ProductManagement from './ProductManagement';

const ProgramPage: React.FC = () => {
  return (
    <Routes>
      <Route path="/management" element={<ProgramManagement />} />
      <Route path="/product" element={<ProductManagement />} />
    </Routes>
  );
};

export default ProgramPage;
