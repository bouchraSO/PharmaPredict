import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Pill, TrendingUp,
  AlertTriangle, Brain, Menu ,Calculator
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/medicaments', icon: Pill, label: 'Médicaments' },
  { to: '/predictions', icon: TrendingUp, label: 'Prédictions' },
  { to: '/recommendations', icon: AlertTriangle, label: 'Réapprovisionnement' },
  { to: '/predict', icon: Calculator, label: 'Simuler une Prédiction' },
  { to: '/model', icon: Brain, label: 'Modèle IA' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
        transform transition-transform lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <Pill className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="font-bold text-gray-900">PharmaPredict</h1>
            <p className="text-xs text-gray-500">Demande & Réapprovisionnement</p>
          </div>
        </div>

        <nav className="mt-6 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b px-6 py-4 flex items-center gap-4 lg:justify-end">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-sm text-gray-500">
            Prédiction de Demande Pharmaceutique
          </span>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}