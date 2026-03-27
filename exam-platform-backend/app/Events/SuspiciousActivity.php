<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SuspiciousActivity implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $examId;
    public $sessionId;
    public $eventType;
    public $severity;

    public function __construct($examId, $sessionId, $eventType, $severity)
    {
        $this->examId = $examId;
        $this->sessionId = $sessionId;
        $this->eventType = $eventType;
        $this->severity = $severity;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('private-exam.' . $this->examId),
        ];
    }

    public function broadcastAs()
    {
        return 'exam.suspicious.activity';
    }

    public function broadcastWith()
    {
        return [
            'exam_id' => $this->examId,
            'session_id' => $this->sessionId,
            'event_type' => $this->eventType,
            'severity' => $this->severity,
        ];
    }
}
