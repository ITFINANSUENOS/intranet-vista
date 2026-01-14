import React from 'react';


export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            
            <main className="flex-grow">
                {children}
            </main>
            
        </div>
    );
}