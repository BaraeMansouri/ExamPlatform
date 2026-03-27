<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamSession extends Model
{
    protected $fillable = [
        'exam_id',
        'username',
        'student_number',
        'group_name',
        'status',
        'started_at',
        'submitted_at',
        'total_score',
        'max_score',
        'is_graded',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'is_graded' => 'boolean',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function answers()
    {
        return $this->hasMany(Answer::class, 'session_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'session_id');
    }

    public function report()
    {
        return $this->hasOne(StudentReport::class, 'session_id');
    }
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
    

}
