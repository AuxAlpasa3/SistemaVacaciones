// src/App.tsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Header } from './components/Header/Header';
import { Home } from './pages/Home/Home';
import { Login } from './pages/Login/Login';
import { NotFound } from './pages/NotFound/NotFound';
import { ToastContainer } from 'react-toastify';

import { Personal } from './pages/Personal/Personal';
import { HistorialPersonal } from './pages/HistorialPersonal/HistorialPersonal';
import { Vacaciones } from './pages/Vacaciones/Vacaciones';

import { TablaVacaciones } from './pages/TablaVacaciones/TablaVacaciones';

import { Departamento } from './pages/Departamento/Departamento';
import { Ubicaciones } from './pages/Ubicaciones/Ubicaciones';
import { Usuarios } from './pages/Usuario/Usuario';
import { Cargo } from './pages/Cargo/Cargo';
import { RutaProtegida } from './components/RutaProtegida/RutaProtegida';
import { Footer } from './components/Footer/Footer';


import './App.css';

// Crear el cliente de React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: true,
            staleTime: 0,
            retry: 1
        }
    }
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
        <Router basename='/SistemaVacaciones/dist'>
          <Routes>
            {/* Login */}
            <Route path="/" element={<Login />} />
            
            {/* Menú Principal */}
            <Route path="/Menu" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <Home />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />

          
            {/* Cargo */}
            <Route path="/Cargo/Cargo" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <Cargo />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />

            {/* Ubicaciones */}
            <Route path="/Ubicaciones/Ubicaciones" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <Ubicaciones />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />

             {/* Departamento */}
            <Route path="/Departamento/Departamento" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <Departamento />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />

            
            {/* VER de detalle */}
            {/* <Route path="/Personal/VerPerfil/:id" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <VerPerfil />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } /> */}

            
              {/* Personal */}
            <Route path="/Personal/Personal" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <Personal />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />

            

              {/* HistorialPersonal */}
            <Route path="/HistorialPersonal/HistorialPersonal" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <HistorialPersonal />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />

            


              {/* Vacaciones */}
            <Route path="/Vacaciones/Vacaciones" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <Vacaciones />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />



              {/* TablaVacaciones */}
            <Route path="/TablaVacaciones/TablaVacaciones" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <TablaVacaciones />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />

            

            {/* Usuario */}
            <Route path="/Usuario" element={
              <RutaProtegida>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
                  <Header onMenuToggle={toggleSidebar} />
                  <div className="content-area">
                    <Usuarios />
                  </div>
                  <Footer />
                </div>
              </RutaProtegida>
            } />


            {/* Ruta No Encontrada */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* ToastContainer para notificaciones */}
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </Router>
    </QueryClientProvider>
  );
}

export default App;