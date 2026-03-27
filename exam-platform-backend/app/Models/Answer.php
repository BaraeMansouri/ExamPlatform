<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Answer extends Model
{
    protected $fillable = [
        'session_id',
        'question_id',
        'text_answer',
        'selected_options',
        'boolean_answer',
        'code_html',
        'code_css',
        'code_js',
        'score',
        'is_correct',
        'professor_comment',
    ];

    protected $casts = [
        'selected_options' => 'array',
        'boolean_answer' => 'boolean',
        'is_correct' => 'boolean',
    ];

    public function session()
    {
        return $this->belongsTo(ExamSession::class, 'session_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}
