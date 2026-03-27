<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $fillable = [
        'name',
        'code',
        'professor_id',
    ];

    public function professor()
    {
        return $this->belongsTo(Professor::class);
    }

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }
}
