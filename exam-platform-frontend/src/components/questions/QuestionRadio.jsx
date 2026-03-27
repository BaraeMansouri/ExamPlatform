const QuestionRadio = ({ question, value, onChange, disabled }) => {
    return (
        <div className="mb-4">
            <h3 className="font-semibold text-lg">{question.content}</h3>

            <div className="mt-2 space-y-2">
                {question.options?.map(opt => (
                    <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name={`q-${question.id}`}
                            value={opt.id}
                            checked={value == opt.id}
                            onChange={(e) => onChange(e.target.value)}
                            disabled={disabled}
                            className="form-radio"
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};