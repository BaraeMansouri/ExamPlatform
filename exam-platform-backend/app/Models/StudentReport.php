<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentReport extends Model
{
    protected $fillable = [
        'session_id',
        'exam_id',
        'professor_id',
        'suspicion_level',
        'danger_events',
        'warning_events',
        'professor_remark',
        'report_pdf_path',
    ];

    public function session()
    {
        return $this->belongsTo(ExamSession::class);
    }

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function professor()
    {
        return $this->belongsTo(Professor::class);
    }
}
