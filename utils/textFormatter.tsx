
import React from 'react';

/**
 * Formats a message string into React elements with support for:
 * - Line breaks (\n)
 * - Bold text (**text**)
 * 
 * @param text The message string to format
 * @returns ReactNode with formatted elements
 */
export const formatMessage = (text: string): React.ReactNode => {
    if (!text) return null;

    // First, split by newlines to handle paragraphs
    const lines = text.split('\n');

    return (
        <>
            {lines.map((line, lineIndex) => {
                // Return a break for empty lines (double newline effect)
                if (line.trim() === '') {
                    return <br key={`br-${lineIndex}`} />;
                }

                // Process bolding within the line
                // Regex matches **text**
                const parts = line.split(/(\*\*.*?\*\*)/g);

                return (
                    <div key={`line-${lineIndex}`} className="min-h-[1.2em]">
                        {parts.map((part, partIndex) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                // Remove asterisks and wrap in strong
                                return (
                                    <strong key={`bold-${lineIndex}-${partIndex}`}>
                                        {part.slice(2, -2)}
                                    </strong>
                                );
                            }
                            return <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>;
                        })}
                    </div>
                );
            })}
        </>
    );
};
