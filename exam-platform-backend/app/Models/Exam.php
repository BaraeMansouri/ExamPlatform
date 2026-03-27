<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = [
        'professor_id',
        'module_id',
        'group_id',
        'title',
        'timer_minutes',
        'private_token',
        'token_used',
        'is_active',
        'is_read',
        'status',
        'total_points',
    ];

    protected $casts = [
        'token_used' => 'boolean',
        'is_active' => 'boolean',
        'is_read' => 'boolean',
    ];

    public function professor()
    {
        return $this->belongsTo(Professor::class);
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function group()
    {
        return $this->belongsTo(StudentGroup::class, 'group_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function sessions()
    {
        return $this->hasMany(ExamSession::class);
    }
}
