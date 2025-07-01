import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
    text: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
        bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
        left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
        right: 'left-full ml-2 top-1/2 transform -translate-y-1/2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-t-4 border-x-transparent border-x-4',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800 border-b-4 border-x-transparent border-x-4',
        left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800 border-l-4 border-y-transparent border-y-4',
        right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800 border-r-4 border-y-transparent border-y-4',
    };

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <HelpCircle size={16} />
            </button>
            
            {isVisible && (
                <div className={`absolute z-50 ${positionClasses[position]}`}>
                    <div className="bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap max-w-xs">
                        {text}
                    </div>
                    <div className={`absolute ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
};

export default HelpTooltip; 