<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'module_id' => 'required|exists:modules,id',
            'group_id' => 'required|exists:student_groups,id',
            'title' => 'required|string|max:255',
            'timer_minutes' => 'required|integer|min:1',
            'status' => 'nullable|in:draft,published,closed',
        ];
    }
}
