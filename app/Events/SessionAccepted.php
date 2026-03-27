<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SessionAccepted implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public $sessionId;
    public $exam_data;
    public $questions;

    public function __construct($sessionId, $exam_data, $questions)
    {
        $this->sessionId = $sessionId;
        $this->exam_data = $exam_data;
        $this->questions = $questions;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('private-session.' . $this->sessionId);
    }

    public function broadcastAs()
    {
        return 'session.accepted';
    }
}
