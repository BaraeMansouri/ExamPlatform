<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentGroup extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    public function exams()
    {
        return $this->hasMany(Exam::class, 'group_id');
    }
}
