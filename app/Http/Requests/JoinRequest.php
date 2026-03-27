<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JoinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => 'required|string',
            'username' => 'required|string|max:255',
            'student_number' => 'required|string|max:255',
            'group_name' => 'required|string|max:255',
        ];
    }
}