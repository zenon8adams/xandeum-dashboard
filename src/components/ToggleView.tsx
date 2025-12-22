import React from 'react';

interface ViewToggleProps {
    isDark: boolean;
    view: 'network' | 'table' | 'world';
    onToggle: (view: 'network' | 'table' | 'world') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ isDark, view, onToggle }) => {
    return (
        <div className="fixed bottom-6 left-6 z-50">
            <div className={`${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-xl border rounded-2xl shadow-2xl p-1.5 flex gap-1`}>
                <button
                    onClick={() => onToggle('network')}
                    className={`${
                        view === 'network'
                            ? isDark
                                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
                                : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                            : isDark
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    } px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2`}
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                        <line x1="12" y1="2" x2="12" y2="9" />
                        <line x1="12" y1="15" x2="12" y2="22" />
                        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                        <line x1="2" y1="12" x2="9" y2="12" />
                        <line x1="15" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
                        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                    </svg>
                    <span className="hidden sm:inline">Network</span>
                </button>
                <button
                    onClick={() => onToggle('world')}
                    className={`${
                        view === 'world'
                            ? isDark
                                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
                                : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                            : isDark
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    } px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2`}
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span className="hidden sm:inline">World</span>
                </button>
                <button
                    onClick={() => onToggle('table')}
                    className={`${
                        view === 'table'
                            ? isDark
                                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
                                : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                            : isDark
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    } px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2`}
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18M3 12h18M3 18h18" />
                    </svg>
                    <span className="hidden sm:inline">Table</span>
                </button>
            </div>
        </div>
    );
};