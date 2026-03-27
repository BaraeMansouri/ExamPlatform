const QuestionCheckbox = ({ question, value, onChange, disabled }) => {
    const selected = Array.isArray(value) ? value.map(String) : [];

    const handleCheck = (id, checked) => {
        const idStr = String(id);

        if (checked) {
            onChange([...selected, idStr]);
        } else {
            onChange(selected.filter(v => v !== idStr));
        }
    };

    return (
        <div className="mb-4">
            <h3 className="font-semibold text-lg">{question.content}</h3>

            <div className="mt-2 space-y-2">
                {question.options?.map(opt => (
                    <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selected.includes(String(opt.id))}
                            onChange={(e) => handleCheck(opt.id, e.target.checked)}
                            disabled={disabled}
                            className="form-checkbox"
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};