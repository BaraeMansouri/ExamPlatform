<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'session_id' => 'required|exists:exam_sessions,id',
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
        ];
    }
}