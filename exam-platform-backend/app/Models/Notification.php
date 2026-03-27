<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'professor_id',
        'exam_id',
        'session_id',
        'type',
        'message',
        'is_read',
        'data',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'data' => 'array',
    ];

    public function professor()
    {
        return $this->belongsTo(Professor::class);
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function session()
    {
        return $this->belongsTo(ExamSession::class, 'session_id');
    }
}
