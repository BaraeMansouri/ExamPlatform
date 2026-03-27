import React from 'react';

const QuestionText = ({ question, value, onChange, disabled }) => {
    return (
        <div className="mb-4">
            <h3 className="font-semibold text-lg">{question.content}</h3>
            <textarea 
                className="w-full mt-2 p-2 border rounded"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Votre réponse..."
                rows={4}
            />
        </div>
    );
};
export default QuestionText;
