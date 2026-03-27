<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Exam;

Broadcast::channel('private-session.{sessionId}', function ($user, $sessionId) {
    return false;
});

Broadcast::channel('private-exam.{examId}', function ($user, $examId) {
    return Exam::whereKey($examId)
        ->where('professor_id', $user->id)
        ->exists();
});
