<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:text,radio,checkbox,code_html,true_false',
            'content' => 'required|string',
            'points' => 'required|integer|min:1',
            'order_index' => 'nullable|integer',
            'code_template' => 'nullable|string',
            'options' => 'nullable|array',
            'options.*.label' => 'required_with:options|string',
            'options.*.is_correct' => 'required_with:options|boolean',
        ];
    }
}
