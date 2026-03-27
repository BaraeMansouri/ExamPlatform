import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const QuestionCode = ({ question, value = {}, onChange, disabled }) => {
    const [html, setHtml] = useState(value.html || '');
    const [css, setCss] = useState(value.css || '');
    const [js, setJs] = useState(value.js || '');

    useEffect(() => {
        if (!disabled && onChange) {
            onChange({ html, css, js });
        }
    }, [html, css, js, disabled, onChange]);

    return (
        <div>
            <h3>{question.content}</h3>

            <div className="flex gap-2 my-2">
                <button onClick={() => setHtml(html)}>HTML</button>
                <button onClick={() => setCss(css)}>CSS</button>
                <button onClick={() => setJs(js)}>JS</button>
            </div>

            <Editor
                height="300px"
                language="html"
                value={html}
                onChange={setHtml}
                options={{ readOnly: disabled }}
            />

            <iframe
                title="preview"
                sandbox="allow-scripts"
                className="w-full h-[200px] border"
                srcDoc={`<style>${css}</style>${html}<script>${js}</script>`}
            />
        </div>
    );
};

export default QuestionCode;