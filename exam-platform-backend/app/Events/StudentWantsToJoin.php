<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentWantsToJoin implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sessionId;
    public $examId;
    public $studentName;
    public $studentNumber;

    public function __construct($sessionId, $examId, $studentName, $studentNumber)
    {
        $this->sessionId = $sessionId;
        $this->examId = $examId;
        $this->studentName = $studentName;
        $this->studentNumber = $studentNumber;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('private-exam.' . $this->examId),
        ];
    }

    public function broadcastAs()
    {
        return 'student.join.request';
    }

    public function broadcastWith()
    {
        return [
            'session_id' => $this->sessionId,
            'exam_id' => $this->examId,
            'student_name' => $this->studentName,
            'student_number' => $this->studentNumber,
        ];
    }
}
