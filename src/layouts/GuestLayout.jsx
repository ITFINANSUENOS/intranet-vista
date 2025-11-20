import React from 'react';
// IMPORTACIÓN CORREGIDA: Sin llaves, ya que Nav y Footer usan 'export default'
import Nav from '../components/Nav';
import Footer from '../components/Footer'; 

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Nav />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}