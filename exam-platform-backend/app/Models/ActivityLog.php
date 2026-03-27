<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'session_id',
        'exam_id',
        'event_type',
        'severity',
        'description',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(ExamSession::class, 'session_id');
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }
}
