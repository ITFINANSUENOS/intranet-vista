import React from 'react';
import { FolderIcon } from '@heroicons/react/24/solid';

const SicFolder = ({ name, onClick, count }) => {
    return (
        <div 
            onClick={onClick}
            className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
            <FolderIcon className="w-16 h-16 text-yellow-400 group-hover:text-yellow-500 transition-colors" />
            <span className="mt-2 text-sm font-semibold text-gray-700 text-center line-clamp-2">{name}</span>
            {count !== undefined && (
                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full mt-1 text-gray-500">
                    {count} elementos
                </span>
            )}
        </div>
    );
};

export default SicFolder;
