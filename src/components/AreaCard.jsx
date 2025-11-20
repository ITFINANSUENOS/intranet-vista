import React from 'react';

const AreaCard = ({ title, description, icon }) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 h-full flex flex-col items-center text-center transition-colors duration-300 hover:border-violet-300">
            <div className="p-4 bg-violet-50 rounded-full text-violet-600 text-3xl mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">
                {description}
            </p>
        </div>
    );
};

export default AreaCard;