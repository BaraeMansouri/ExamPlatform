<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;


class Professor extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }

    public function modules()
    {
        return $this->hasMany(Module::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}